from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserProfile


class RegisterViewTest(APITestCase):
    def test_register_success(self):
        url = reverse('register')
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_register_password_mismatch(self):
        url = reverse('register')
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPass123!',
            'password2': 'WrongPass123!',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password2', response.data)

    def test_register_duplicate_username(self):
        User.objects.create_user(username='existing', email='a@example.com', password='pass')
        url = reverse('register')
        data = {
            'username': 'existing',
            'email': 'b@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_register_missing_email(self):
        url = reverse('register')
        data = {
            'username': 'testuser',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_weak_password(self):
        url = reverse('register')
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': '123',
            'password2': '123',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class TokenViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!',
        )

    def test_login_success(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username': 'testuser', 'password': 'StrongPass123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username': 'testuser', 'password': 'wrongpassword'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        token_url = reverse('token_obtain_pair')
        token_res = self.client.post(token_url, {'username': 'testuser', 'password': 'StrongPass123!'})
        refresh_url = reverse('token_refresh')
        response = self.client.post(refresh_url, {'refresh': token_res.data['refresh']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


class MeViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!',
        )

    def _get_token(self):
        url = reverse('token_obtain_pair')
        res = self.client.post(url, {'username': 'testuser', 'password': 'StrongPass123!'})
        return res.data['access']

    def test_me_authenticated(self):
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertIn('id', response.data)
        self.assertIn('date_joined', response.data)

    def test_me_unauthenticated(self):
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileModelTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='StrongPass123!'
        )
        self.profile = UserProfile.objects.get_or_create(user=self.user)[0]

    def test_is_pro_false_for_free_tier(self):
        self.profile.subscription_tier = UserProfile.TIER_FREE
        self.profile.subscription_status = UserProfile.STATUS_INACTIVE
        self.assertFalse(self.profile.is_pro)

    def test_is_pro_true_for_active_pro(self):
        self.profile.subscription_tier = UserProfile.TIER_PRO
        self.profile.subscription_status = UserProfile.STATUS_ACTIVE
        self.assertTrue(self.profile.is_pro)

    def test_is_pro_false_for_cancelled_pro(self):
        self.profile.subscription_tier = UserProfile.TIER_PRO
        self.profile.subscription_status = UserProfile.STATUS_CANCELLED
        self.assertFalse(self.profile.is_pro)

    def test_is_pro_false_for_past_due_pro(self):
        self.profile.subscription_tier = UserProfile.TIER_PRO
        self.profile.subscription_status = UserProfile.STATUS_PAST_DUE
        self.assertFalse(self.profile.is_pro)

    def test_str(self):
        self.profile.subscription_tier = UserProfile.TIER_FREE
        self.assertEqual(str(self.profile), 'testuser — free')


class ProfileSignalTest(APITestCase):
    def test_profile_auto_created_on_user_creation(self):
        user = User.objects.create_user(
            username='signaluser', email='signal@example.com', password='StrongPass123!'
        )
        self.assertTrue(UserProfile.objects.filter(user=user).exists())

    def test_profile_defaults_to_free_tier(self):
        user = User.objects.create_user(
            username='freeuser', email='free@example.com', password='StrongPass123!'
        )
        profile = UserProfile.objects.get(user=user)
        self.assertEqual(profile.subscription_tier, UserProfile.TIER_FREE)
        self.assertEqual(profile.subscription_status, UserProfile.STATUS_INACTIVE)


class MeViewProfileTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='StrongPass123!'
        )

    def _get_token(self):
        res = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'testuser', 'password': 'StrongPass123!'},
        )
        return res.data['access']

    def test_me_includes_profile(self):
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile', response.data)
        self.assertEqual(response.data['profile']['subscription_tier'], 'free')
        self.assertFalse(response.data['profile']['is_pro'])

    def test_me_includes_first_last_name(self):
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('me'))
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)


class ProfileUpdateViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='StrongPass123!'
        )
        self.other_user = User.objects.create_user(
            username='other', email='other@example.com', password='StrongPass123!'
        )

    def _get_token(self):
        res = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'testuser', 'password': 'StrongPass123!'},
        )
        return res.data['access']

    def test_patch_updates_name_and_bio(self):
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.patch(
            reverse('profile'),
            {'first_name': 'Elena', 'last_name': 'Smith', 'bio': 'Hello world'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Elena')
        self.assertEqual(response.data['last_name'], 'Smith')
        self.assertEqual(response.data['profile']['bio'], 'Hello world')
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Elena')

    def test_patch_updates_email(self):
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.patch(
            reverse('profile'), {'email': 'new@example.com'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'new@example.com')

    def test_patch_rejects_duplicate_email(self):
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.patch(
            reverse('profile'), {'email': 'other@example.com'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_patch_unauthenticated_returns_401(self):
        response = self.client.patch(
            reverse('profile'), {'first_name': 'Hacker'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
