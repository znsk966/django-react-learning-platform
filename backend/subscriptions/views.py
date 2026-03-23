import datetime

import stripe
from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import UserProfile
from users.serializers import UserProfileSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY


class CheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        if not profile.stripe_customer_id:
            customer = stripe.Customer.create(
                email=request.user.email,
                metadata={'user_id': request.user.id},
            )
            profile.stripe_customer_id = customer.id
            profile.save()

        session = stripe.checkout.Session.create(
            customer=profile.stripe_customer_id,
            mode='subscription',
            line_items=[{'price': settings.STRIPE_PRO_PRICE_ID, 'quantity': 1}],
            success_url=f"{settings.FRONTEND_URL}/profile?checkout=success",
            cancel_url=f"{settings.FRONTEND_URL}/profile?checkout=cancelled",
        )
        return Response({'checkout_url': session.url})


class WebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        try:
            event = stripe.Webhook.construct_event(
                request.body, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        handlers = {
            'checkout.session.completed': self._handle_checkout_completed,
            'customer.subscription.updated': self._handle_subscription_updated,
            'customer.subscription.deleted': self._handle_subscription_deleted,
        }

        handler = handlers.get(event['type'])
        if handler:
            handler(event['data']['object'])

        return Response({'status': 'ok'})

    def _get_profile_by_customer(self, customer_id):
        try:
            return UserProfile.objects.get(stripe_customer_id=customer_id)
        except UserProfile.DoesNotExist:
            return None

    def _handle_checkout_completed(self, session):
        profile = self._get_profile_by_customer(session.get('customer'))
        if not profile:
            return
        profile.subscription_tier = UserProfile.TIER_PRO
        profile.subscription_status = UserProfile.STATUS_ACTIVE
        profile.stripe_subscription_id = session.get('subscription', '')
        profile.save()

    def _handle_subscription_updated(self, subscription):
        profile = self._get_profile_by_customer(subscription.get('customer'))
        if not profile:
            return
        stripe_status = subscription.get('status', '')
        status_map = {
            'active': UserProfile.STATUS_ACTIVE,
            'past_due': UserProfile.STATUS_PAST_DUE,
            'canceled': UserProfile.STATUS_CANCELLED,
            'incomplete': UserProfile.STATUS_INACTIVE,
            'incomplete_expired': UserProfile.STATUS_INACTIVE,
            'trialing': UserProfile.STATUS_ACTIVE,
            'unpaid': UserProfile.STATUS_PAST_DUE,
        }
        profile.subscription_status = status_map.get(stripe_status, UserProfile.STATUS_INACTIVE)

        period_end = subscription.get('current_period_end')
        if period_end:
            profile.current_period_end = timezone.datetime.fromtimestamp(
                period_end, tz=datetime.timezone.utc
            )
        profile.save()

    def _handle_subscription_deleted(self, subscription):
        profile = self._get_profile_by_customer(subscription.get('customer'))
        if not profile:
            return
        profile.subscription_tier = UserProfile.TIER_FREE
        profile.subscription_status = UserProfile.STATUS_CANCELLED
        profile.stripe_subscription_id = ''
        profile.current_period_end = None
        profile.save()


class CustomerPortalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            return Response(
                {'detail': 'No subscription found.'}, status=status.HTTP_400_BAD_REQUEST
            )

        if not profile.stripe_customer_id:
            return Response(
                {'detail': 'No subscription found.'}, status=status.HTTP_400_BAD_REQUEST
            )

        portal_session = stripe.billing_portal.Session.create(
            customer=profile.stripe_customer_id,
            return_url=f"{settings.FRONTEND_URL}/profile",
        )
        return Response({'portal_url': portal_session.url})


class SubscriptionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)
