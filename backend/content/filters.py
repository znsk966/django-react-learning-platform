import django_filters

from .models import Lesson, Module


class ModuleFilter(django_filters.FilterSet):
    title      = django_filters.CharFilter(lookup_expr='icontains')
    slug       = django_filters.CharFilter(lookup_expr='exact')
    difficulty = django_filters.ChoiceFilter(choices=Module.DIFFICULTY_CHOICES)
    tag        = django_filters.CharFilter(field_name='tags__slug', lookup_expr='exact')
    author     = django_filters.NumberFilter(field_name='author__id')

    class Meta:
        model  = Module
        fields = ['title', 'slug', 'difficulty', 'tag', 'author']


class LessonFilter(django_filters.FilterSet):
    title  = django_filters.CharFilter(lookup_expr='icontains')
    module = django_filters.NumberFilter(field_name='module__id')
    order  = django_filters.NumberFilter()

    class Meta:
        model  = Lesson
        fields = ['title', 'module', 'order']
