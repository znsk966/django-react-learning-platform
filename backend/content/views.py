from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Module, Lesson
from .serializers import ModuleSerializer, LessonSerializer
from .filters import ModuleFilter, LessonFilter

class ModuleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ModuleFilter


class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Lesson.objects.select_related('module').all()
    serializer_class = LessonSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = LessonFilter