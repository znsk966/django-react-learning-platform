from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from users.models import UserProfile

from .filters import LessonFilter, ModuleFilter
from .models import Lesson, Module, Tag
from .serializers import LessonSerializer, ModuleSerializer, TagSerializer


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

    def retrieve(self, request, *args, **kwargs):
        lesson = self.get_object()
        if lesson.module.difficulty == Module.ADVANCED:
            if not request.user.is_authenticated:
                raise PermissionDenied('This lesson requires a Pro subscription.')
            try:
                if not request.user.profile.is_pro:
                    raise PermissionDenied('This lesson requires a Pro subscription.')
            except UserProfile.DoesNotExist:
                raise PermissionDenied('This lesson requires a Pro subscription.')
        return super().retrieve(request, *args, **kwargs)
