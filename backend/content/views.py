from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .models import Module, Lesson, Tag
from .serializers import ModuleSerializer, LessonSerializer, TagSerializer
from .filters import ModuleFilter, LessonFilter


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = None  # return all tags in one response


class ModuleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Module.objects
        .filter(is_published=True)
        .select_related('author')
        .prefetch_related('tags', 'lessons')
    )
    serializer_class = ModuleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ModuleFilter


class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Lesson.objects.select_related('module').all()
    serializer_class = LessonSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = LessonFilter
