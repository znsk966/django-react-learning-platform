from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    TIER_FREE = 'free'
    TIER_PRO = 'pro'
    TIER_CHOICES = [
        (TIER_FREE, 'Free'),
        (TIER_PRO, 'Pro'),
    ]

    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_CANCELLED = 'cancelled'
    STATUS_PAST_DUE = 'past_due'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_PAST_DUE, 'Past Due'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    bio = models.TextField(blank=True, max_length=500)
    subscription_tier = models.CharField(
        max_length=10, choices=TIER_CHOICES, default=TIER_FREE
    )
    subscription_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_INACTIVE
    )
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} — {self.subscription_tier}"

    @property
    def is_pro(self):
        return (
            self.subscription_tier == self.TIER_PRO
            and self.subscription_status == self.STATUS_ACTIVE
        )
