from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from content.models import Module, Lesson
from .models import LessonProgress


class LessonProgressSetupMixin:
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='StrongPass123!'
        )
        self.other_user = User.objects.create_user(
            username='otheruser', email='other@example.com', password='StrongPass123!'
        )
        self.module = Module.objects.create(title='Python', slug='python', description='')
        self.lesson1 = Lesson.objects.create(
            module=self.module, title='Lesson 1', slug='lesson-1', content_md='# L1', order=1
        )
        self.lesson2 = Lesson.objects.create(
            module=self.module, title='Lesson 2', slug='lesson-2', content_md='# L2', order=2
        )

    def _auth(self, user=None):
        target = user or self.user
        token_url = reverse('token_obtain_pair')
        res = self.client.post(token_url, {'username': target.username, 'password': 'StrongPass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {res.data["access"]}')


class ListProgressTest(LessonProgressSetupMixin, APITestCase):
    def test_unauthenticated_returns_401(self):
        response = self.client.get(reverse('progress-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_list(self):
        self._auth()
        response = self.client.get(reverse('progress-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_returns_only_own_progress(self):
        LessonProgress.objects.create(user=self.user, lesson=self.lesson1)
        LessonProgress.objects.create(user=self.other_user, lesson=self.lesson1)
        self._auth()
        response = self.client.get(reverse('progress-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['lesson'], self.lesson1.id)


class MarkCompleteTest(LessonProgressSetupMixin, APITestCase):
    def test_unauthenticated_returns_401(self):
        response = self.client.post(reverse('progress-list'), {'lesson': self.lesson1.id})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_lesson_complete(self):
        self._auth()
        response = self.client.post(reverse('progress-list'), {'lesson': self.lesson1.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['lesson'], self.lesson1.id)
        self.assertIn('completed_at', response.data)
        self.assertTrue(LessonProgress.objects.filter(user=self.user, lesson=self.lesson1).exists())

    def test_mark_already_complete_is_idempotent(self):
        LessonProgress.objects.create(user=self.user, lesson=self.lesson1)
        self._auth()
        response = self.client.post(reverse('progress-list'), {'lesson': self.lesson1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(LessonProgress.objects.filter(user=self.user, lesson=self.lesson1).count(), 1)

    def test_mark_invalid_lesson_returns_400(self):
        self._auth()
        response = self.client.post(reverse('progress-list'), {'lesson': 99999})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_two_users_can_complete_same_lesson(self):
        self._auth()
        self.client.post(reverse('progress-list'), {'lesson': self.lesson1.id})
        self._auth(self.other_user)
        response = self.client.post(reverse('progress-list'), {'lesson': self.lesson1.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LessonProgress.objects.filter(lesson=self.lesson1).count(), 2)


class UnmarkCompleteTest(LessonProgressSetupMixin, APITestCase):
    def test_unauthenticated_returns_401(self):
        response = self.client.delete(reverse('progress-detail', args=[self.lesson1.id]))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unmark_lesson(self):
        LessonProgress.objects.create(user=self.user, lesson=self.lesson1)
        self._auth()
        response = self.client.delete(reverse('progress-detail', args=[self.lesson1.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(LessonProgress.objects.filter(user=self.user, lesson=self.lesson1).exists())

    def test_unmark_not_completed_returns_404(self):
        self._auth()
        response = self.client.delete(reverse('progress-detail', args=[self.lesson1.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_unmark_other_users_progress(self):
        LessonProgress.objects.create(user=self.other_user, lesson=self.lesson1)
        self._auth()
        response = self.client.delete(reverse('progress-detail', args=[self.lesson1.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(LessonProgress.objects.filter(user=self.other_user, lesson=self.lesson1).exists())
