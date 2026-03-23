from django.urls import path

from .views import (
    CheckoutSessionView,
    CustomerPortalView,
    SubscriptionStatusView,
    WebhookView,
)

urlpatterns = [
    path('create-checkout-session/', CheckoutSessionView.as_view(), name='create-checkout-session'),
    path('webhook/', WebhookView.as_view(), name='stripe-webhook'),
    path('portal/', CustomerPortalView.as_view(), name='customer-portal'),
    path('status/', SubscriptionStatusView.as_view(), name='subscription-status'),
]
