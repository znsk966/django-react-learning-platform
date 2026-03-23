import json
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import UserProfile


def make_user(username='testuser', email='test@example.com', password='StrongPass123!'):
    return User.objects.create_user(username=username, email=email, password=password)


def get_token(client, username='testuser', password='StrongPass123!'):
    res = client.post(reverse('token_obtain_pair'), {'username': username, 'password': password})
    return res.data['access']


class CheckoutSessionViewTest(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.token = get_token(self.client)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    @patch('subscriptions.views.stripe.checkout.Session.create')
    @patch('subscriptions.views.stripe.Customer.create')
    def test_creates_checkout_session(self, mock_customer_create, mock_session_create):
        mock_customer_create.return_value = MagicMock(id='cus_test123')
        mock_session_create.return_value = MagicMock(url='https://checkout.stripe.com/test')

        response = self.client.post(reverse('create-checkout-session'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('checkout_url', response.data)
        self.assertEqual(response.data['checkout_url'], 'https://checkout.stripe.com/test')

    @patch('subscriptions.views.stripe.checkout.Session.create')
    def test_reuses_existing_customer_id(self, mock_session_create):
        profile = UserProfile.objects.get(user=self.user)
        profile.stripe_customer_id = 'cus_existing'
        profile.save()

        mock_session_create.return_value = MagicMock(url='https://checkout.stripe.com/test2')

        response = self.client.post(reverse('create-checkout-session'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # stripe.Customer.create should NOT have been called
        mock_session_create.assert_called_once()

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(reverse('create-checkout-session'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WebhookViewTest(APITestCase):
    def setUp(self):
        self.user = make_user()
        profile = UserProfile.objects.get(user=self.user)
        profile.stripe_customer_id = 'cus_webhook_test'
        profile.save()
        self.profile = profile

    def _post_event(self, event_type, obj_data):
        event = {
            'type': event_type,
            'data': {'object': obj_data},
        }
        with patch('subscriptions.views.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.return_value = event
            return self.client.post(
                reverse('stripe-webhook'),
                data=json.dumps(event),
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='test_sig',
            )

    def test_checkout_completed_upgrades_user(self):
        response = self._post_event(
            'checkout.session.completed',
            {'customer': 'cus_webhook_test', 'subscription': 'sub_abc123'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.subscription_tier, UserProfile.TIER_PRO)
        self.assertEqual(self.profile.subscription_status, UserProfile.STATUS_ACTIVE)
        self.assertEqual(self.profile.stripe_subscription_id, 'sub_abc123')

    def test_subscription_deleted_downgrades_user(self):
        self.profile.subscription_tier = UserProfile.TIER_PRO
        self.profile.subscription_status = UserProfile.STATUS_ACTIVE
        self.profile.save()

        response = self._post_event(
            'customer.subscription.deleted',
            {'customer': 'cus_webhook_test', 'status': 'canceled'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.subscription_tier, UserProfile.TIER_FREE)
        self.assertEqual(self.profile.subscription_status, UserProfile.STATUS_CANCELLED)
        self.assertEqual(self.profile.stripe_subscription_id, '')

    def test_subscription_updated_changes_status(self):
        response = self._post_event(
            'customer.subscription.updated',
            {'customer': 'cus_webhook_test', 'status': 'past_due', 'current_period_end': None},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.subscription_status, UserProfile.STATUS_PAST_DUE)

    def test_unknown_event_type_returns_200(self):
        response = self._post_event('payment_intent.created', {'customer': 'cus_webhook_test'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_bad_signature_returns_400(self):
        with patch('subscriptions.views.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.side_effect = ValueError('bad sig')
            response = self.client.post(
                reverse('stripe-webhook'),
                data='{}',
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='bad',
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_customer_handled_gracefully(self):
        response = self._post_event(
            'checkout.session.completed',
            {'customer': 'cus_nonexistent', 'subscription': 'sub_xyz'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CustomerPortalViewTest(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.token = get_token(self.client)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_no_customer_id_returns_400(self):
        response = self.client.get(reverse('customer-portal'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('subscriptions.views.stripe.billing_portal.Session.create')
    def test_returns_portal_url(self, mock_portal):
        profile = UserProfile.objects.get(user=self.user)
        profile.stripe_customer_id = 'cus_portal_test'
        profile.save()

        mock_portal.return_value = MagicMock(url='https://billing.stripe.com/portal/test')
        response = self.client.get(reverse('customer-portal'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('portal_url', response.data)

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(reverse('customer-portal'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SubscriptionStatusViewTest(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.token = get_token(self.client)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_returns_profile_fields(self):
        response = self.client.get(reverse('subscription-status'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('subscription_tier', response.data)
        self.assertIn('subscription_status', response.data)
        self.assertIn('is_pro', response.data)
        self.assertEqual(response.data['subscription_tier'], 'free')
        self.assertFalse(response.data['is_pro'])

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(reverse('subscription-status'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
