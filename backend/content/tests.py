from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Lesson, Module


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
        self.module1 = Module.objects.create(title='Module A', slug='module-a', description='Desc A')
        self.module2 = Module.objects.create(title='Module B', slug='module-b')
        Lesson.objects.create(module=self.module1, title='Lesson 1', slug='lesson-1', content_md='# L1', order=1)
        Lesson.objects.create(module=self.module1, title='Lesson 2', slug='lesson-2', content_md='# L2', order=2)

    def test_list_modules_returns_200(self):
        url = reverse('module-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

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

    def test_module_serializer_fields(self):
        url = reverse('module-detail', args=[self.module1.id])
        response = self.client.get(url)
        for field in ['id', 'title', 'slug', 'description', 'lessons']:
            self.assertIn(field, response.data)


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
