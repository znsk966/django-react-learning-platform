from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import UserProfile

from .models import Lesson, Module, Tag


class ModuleModelTest(TestCase):
    def setUp(self):
        self.module = Module.objects.create(
            title='Test Module',
            slug='test-module',
            description='A test module',
        )

    def test_str(self):
        self.assertEqual(str(self.module), 'Test Module')

    def test_ordering(self):
        Module.objects.create(title='Alpha Module', slug='alpha')
        Module.objects.create(title='Zeta Module', slug='zeta')
        titles = list(Module.objects.values_list('title', flat=True))
        self.assertEqual(titles, sorted(titles))

    def test_description_optional(self):
        m = Module.objects.create(title='No Desc', slug='no-desc')
        self.assertEqual(m.description, '')

    def test_slug_unique(self):
        with self.assertRaises(Exception):
            Module.objects.create(title='Duplicate', slug='test-module')

    def test_default_difficulty_is_beginner(self):
        m = Module.objects.create(title='Default Diff', slug='default-diff')
        self.assertEqual(m.difficulty, Module.BEGINNER)

    def test_is_published_defaults_to_true(self):
        m = Module.objects.create(title='Published', slug='published')
        self.assertTrue(m.is_published)

    def test_author_optional(self):
        m = Module.objects.create(title='No Author', slug='no-author')
        self.assertIsNone(m.author)

    def test_estimated_duration_optional(self):
        m = Module.objects.create(title='No Duration', slug='no-duration')
        self.assertIsNone(m.estimated_duration)


class TagModelTest(TestCase):
    def test_str(self):
        tag = Tag.objects.create(name='Python', slug='python')
        self.assertEqual(str(tag), 'Python')

    def test_tags_ordered_by_name(self):
        Tag.objects.create(name='Zeta', slug='zeta')
        Tag.objects.create(name='Alpha', slug='alpha')
        names = list(Tag.objects.values_list('name', flat=True))
        self.assertEqual(names, sorted(names))

    def test_tag_name_unique(self):
        Tag.objects.create(name='Python', slug='python')
        with self.assertRaises(Exception):
            Tag.objects.create(name='Python', slug='python-2')


class LessonModelTest(TestCase):
    def setUp(self):
        self.module = Module.objects.create(title='Module A', slug='module-a')
        self.lesson = Lesson.objects.create(
            module=self.module,
            title='Lesson 1',
            slug='lesson-1',
            content_md='# Hello',
            order=1,
        )

    def test_str(self):
        self.assertEqual(str(self.lesson), 'Module A - Lesson 1')

    def test_ordering_within_module(self):
        Lesson.objects.create(module=self.module, title='Lesson 3', slug='lesson-3', content_md='', order=3)
        Lesson.objects.create(module=self.module, title='Lesson 2', slug='lesson-2', content_md='', order=2)
        orders = list(Lesson.objects.filter(module=self.module).values_list('order', flat=True))
        self.assertEqual(orders, sorted(orders))

    def test_cascade_delete(self):
        self.module.delete()
        self.assertFalse(Lesson.objects.filter(slug='lesson-1').exists())

    def test_order_minimum_value(self):
        lesson = Lesson(
            module=self.module,
            title='Bad Order',
            slug='bad-order',
            content_md='',
            order=0,
        )
        with self.assertRaises(ValidationError):
            lesson.full_clean()

    def test_order_valid_value(self):
        lesson = Lesson(
            module=self.module,
            title='Good Order',
            slug='good-order',
            content_md='# Valid',
            order=1,
        )
        lesson.full_clean()  # should not raise


class ModuleAPITest(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username='author', first_name='Jane', last_name='Doe', password='pass'
        )
        self.tag_py = Tag.objects.create(name='Python', slug='python')
        self.tag_oop = Tag.objects.create(name='OOP', slug='oop')

        self.module1 = Module.objects.create(
            title='Module A', slug='module-a', description='Desc A',
            difficulty=Module.BEGINNER, estimated_duration=60,
            author=self.author,
        )
        self.module1.tags.add(self.tag_py)

        self.module2 = Module.objects.create(
            title='Module B', slug='module-b',
            difficulty=Module.ADVANCED,
        )
        self.module2.tags.add(self.tag_oop)

        self.module_draft = Module.objects.create(
            title='Draft Module', slug='draft-module', is_published=False,
        )

        Lesson.objects.create(module=self.module1, title='Lesson 1', slug='lesson-1', content_md='# L1', order=1)
        Lesson.objects.create(module=self.module1, title='Lesson 2', slug='lesson-2', content_md='# L2', order=2)

    def test_list_modules_returns_200(self):
        url = reverse('module-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_modules_excludes_unpublished(self):
        url = reverse('module-list')
        response = self.client.get(url)
        titles = [m['title'] for m in response.data['results']]
        self.assertNotIn('Draft Module', titles)

    def test_list_modules_paginated(self):
        url = reverse('module-list')
        response = self.client.get(url)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        self.assertEqual(response.data['count'], 2)

    def test_module_detail_returns_200(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Module A')
        self.assertEqual(response.data['slug'], 'module-a')
        self.assertEqual(response.data['description'], 'Desc A')

    def test_module_detail_includes_nested_lessons(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        self.assertEqual(len(response.data['lessons']), 2)
        lesson_slugs = [l['slug'] for l in response.data['lessons']]
        self.assertIn('lesson-1', lesson_slugs)
        self.assertIn('lesson-2', lesson_slugs)

    def test_module_detail_404(self):
        url = reverse('module-detail', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_module_serializer_fields(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        for field in ['id', 'title', 'slug', 'description', 'difficulty',
                      'estimated_duration', 'learning_objectives', 'thumbnail_url',
                      'tags', 'author', 'lesson_count', 'lessons']:
            self.assertIn(field, response.data)

    def test_module_detail_includes_author(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        self.assertEqual(response.data['author']['username'], 'author')
        self.assertEqual(response.data['author']['full_name'], 'Jane Doe')

    def test_module_detail_author_null_when_unset(self):
        url = reverse('module-detail', args=[self.module2.id])
        response = self.client.get(url)
        self.assertIsNone(response.data['author'])

    def test_module_detail_includes_tags(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        tag_slugs = [t['slug'] for t in response.data['tags']]
        self.assertIn('python', tag_slugs)

    def test_module_detail_difficulty(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        self.assertEqual(response.data['difficulty'], Module.BEGINNER)

    def test_module_detail_estimated_duration(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        self.assertEqual(response.data['estimated_duration'], 60)

    def test_module_detail_lesson_count(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        self.assertEqual(response.data['lesson_count'], 2)

    def test_filter_by_difficulty(self):
        url = reverse('module-list')
        response = self.client.get(url, {'difficulty': 'beginner'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], 'module-a')

    def test_filter_by_tag(self):
        url = reverse('module-list')
        response = self.client.get(url, {'tag': 'python'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], 'module-a')

    def test_filter_by_author(self):
        url = reverse('module-list')
        response = self.client.get(url, {'author': self.author.id})
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], 'module-a')

    def test_module_filter_by_title(self):
        url = reverse('module-list')
        response = self.client.get(url, {'title': 'Module A'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Module A')

    def test_module_filter_by_title_case_insensitive(self):
        url = reverse('module-list')
        response = self.client.get(url, {'title': 'module a'})
        self.assertEqual(len(response.data['results']), 1)

    def test_module_filter_by_slug(self):
        url = reverse('module-list')
        response = self.client.get(url, {'slug': 'module-b'})
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], 'module-b')

    def test_module_post_not_allowed(self):
        url = reverse('module-list')
        response = self.client.post(url, {'title': 'New', 'slug': 'new'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_module_put_not_allowed(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.put(url, {'title': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_module_delete_not_allowed(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class TagAPITest(APITestCase):
    def setUp(self):
        Tag.objects.create(name='Python', slug='python')
        Tag.objects.create(name='Django', slug='django')

    def test_list_tags_returns_200(self):
        url = reverse('tag-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_tags_returns_all_without_pagination(self):
        url = reverse('tag-list')
        response = self.client.get(url)
        # No pagination wrapper — plain list
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)

    def test_tag_serializer_fields(self):
        url = reverse('tag-list')
        response = self.client.get(url)
        for field in ['id', 'name', 'slug']:
            self.assertIn(field, response.data[0])

    def test_tag_post_not_allowed(self):
        url = reverse('tag-list')
        response = self.client.post(url, {'name': 'New', 'slug': 'new'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class LessonAPITest(APITestCase):
    def setUp(self):
        self.module1 = Module.objects.create(title='Module A', slug='module-a')
        self.module2 = Module.objects.create(title='Module B', slug='module-b')
        self.lesson1 = Lesson.objects.create(
            module=self.module1, title='Lesson 1', slug='lesson-1', content_md='# Hello', order=1
        )
        self.lesson2 = Lesson.objects.create(
            module=self.module1, title='Lesson 2', slug='lesson-2', content_md='# World', order=2
        )
        self.lesson3 = Lesson.objects.create(
            module=self.module2, title='Lesson 3', slug='lesson-3', content_md='# Other', order=1
        )

    def test_list_lessons_returns_200(self):
        url = reverse('lesson-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_lessons_paginated(self):
        url = reverse('lesson-list')
        response = self.client.get(url)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 3)

    def test_lesson_detail_returns_200(self):
        url = reverse('lesson-detail', args=[self.lesson1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Lesson 1')
        self.assertEqual(response.data['content_md'], '# Hello')

    def test_lesson_detail_404(self):
        url = reverse('lesson-detail', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_lessons_by_module(self):
        url = reverse('lesson-list')
        response = self.client.get(url, {'module': self.module1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_lessons_by_title(self):
        url = reverse('lesson-list')
        response = self.client.get(url, {'title': 'Lesson 1'})
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], 'lesson-1')

    def test_filter_lessons_by_order(self):
        url = reverse('lesson-list')
        response = self.client.get(url, {'order': 1})
        self.assertEqual(len(response.data['results']), 2)

    def test_lesson_post_not_allowed(self):
        url = reverse('lesson-list')
        response = self.client.post(url, {'title': 'New', 'slug': 'new'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_lesson_put_not_allowed(self):
        url = reverse('lesson-detail', args=[self.lesson1.id])
        response = self.client.put(url, {'title': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_lesson_delete_not_allowed(self):
        url = reverse('lesson-detail', args=[self.lesson1.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_lesson_serializer_fields(self):
        url = reverse('lesson-detail', args=[self.lesson1.id])
        response = self.client.get(url)
        for field in ['id', 'title', 'slug', 'order', 'content_md', 'module']:
            self.assertIn(field, response.data)

    def test_lessons_ordered_by_module_then_order(self):
        url = reverse('lesson-list')
        response = self.client.get(url, {'module': self.module1.id})
        orders = [l['order'] for l in response.data['results']]
        self.assertEqual(orders, sorted(orders))


class ContentGatingTest(APITestCase):
    def setUp(self):
        # Advanced module + lesson (gated)
        self.adv_module = Module.objects.create(
            title='Advanced Module', slug='advanced-module', difficulty=Module.ADVANCED
        )
        self.adv_lesson = Lesson.objects.create(
            module=self.adv_module,
            title='Advanced Lesson',
            slug='advanced-lesson',
            content_md='# Advanced Content',
            order=1,
        )

        # Beginner module + lesson (free)
        self.beg_module = Module.objects.create(
            title='Beginner Module', slug='beginner-module', difficulty=Module.BEGINNER
        )
        self.beg_lesson = Lesson.objects.create(
            module=self.beg_module,
            title='Beginner Lesson',
            slug='beginner-lesson',
            content_md='# Beginner Content',
            order=1,
        )

        # Users
        self.free_user = User.objects.create_user(
            username='free_user', email='free@example.com', password='StrongPass123!'
        )
        UserProfile.objects.filter(user=self.free_user).update(
            subscription_tier=UserProfile.TIER_FREE,
            subscription_status=UserProfile.STATUS_INACTIVE,
        )

        self.pro_user = User.objects.create_user(
            username='pro_user', email='pro@example.com', password='StrongPass123!'
        )
        UserProfile.objects.filter(user=self.pro_user).update(
            subscription_tier=UserProfile.TIER_PRO,
            subscription_status=UserProfile.STATUS_ACTIVE,
        )

    def _get_token(self, username, password='StrongPass123!'):
        res = self.client.post(reverse('token_obtain_pair'), {'username': username, 'password': password})
        return res.data['access']

    # ── Module is_locked field ─────────────────────────────────────────────

    def test_advanced_module_is_locked_for_anonymous(self):
        response = self.client.get(reverse('module-detail', args=[self.adv_module.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_locked'])

    def test_advanced_module_is_locked_for_free_user(self):
        token = self._get_token('free_user')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('module-detail', args=[self.adv_module.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_locked'])

    def test_advanced_module_is_not_locked_for_pro_user(self):
        token = self._get_token('pro_user')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('module-detail', args=[self.adv_module.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_locked'])

    def test_beginner_module_is_not_locked_for_anyone(self):
        response = self.client.get(reverse('module-detail', args=[self.beg_module.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_locked'])

    # ── Lesson detail gating ───────────────────────────────────────────────

    def test_advanced_lesson_detail_returns_403_for_anonymous(self):
        response = self.client.get(reverse('lesson-detail', args=[self.adv_lesson.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_advanced_lesson_detail_returns_403_for_free_user(self):
        token = self._get_token('free_user')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('lesson-detail', args=[self.adv_lesson.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_advanced_lesson_detail_returns_200_for_pro_user(self):
        token = self._get_token('pro_user')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('lesson-detail', args=[self.adv_lesson.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Advanced Lesson')

    def test_beginner_lesson_detail_returns_200_for_anonymous(self):
        response = self.client.get(reverse('lesson-detail', args=[self.beg_lesson.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_beginner_lesson_detail_returns_200_for_free_user(self):
        token = self._get_token('free_user')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('lesson-detail', args=[self.beg_lesson.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_advanced_lesson_list_still_accessible_for_free_user(self):
        # List endpoint should NOT be gated — only detail
        token = self._get_token('free_user')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(reverse('lesson-list'), {'module': self.adv_module.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
