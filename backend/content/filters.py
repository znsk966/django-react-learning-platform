import django_filters
from .models import Lesson, Module

class ModuleFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')
    slug = django_filters.CharFilter(lookup_expr='exact')

    class Meta:
        model = Module
        fields = ['title', 'slug']


class LessonFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')
    module = django_filters.NumberFilter(field_name='module__id')
    order = django_filters.NumberFilter()

    class Meta:
        model = Lesson
        fields = ['title', 'module', 'order']