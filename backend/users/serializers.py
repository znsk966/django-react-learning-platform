from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm password')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    is_pro = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'bio',
            'subscription_tier',
            'subscription_status',
            'current_period_end',
            'is_pro',
        ]
        read_only_fields = ['subscription_tier', 'subscription_status', 'current_period_end']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'date_joined', 'profile']


class UserProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    last_name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    email = serializers.EmailField(required=False)
    bio = serializers.CharField(required=False, max_length=500, allow_blank=True)

    def validate_email(self, value):
        request = self.context.get('request')
        if request and User.objects.exclude(pk=request.user.pk).filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value
