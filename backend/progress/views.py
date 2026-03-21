from rest_framework import mixins, viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import LessonProgress
from .serializers import LessonProgressSerializer


class LessonProgressViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = LessonProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LessonProgress.objects.filter(user=self.request.user).select_related('lesson')

    def create(self, request, *args, **kwargs):
        # Idempotent: return 200 if already completed, 201 if newly created
        lesson_id = request.data.get('lesson')
        existing = LessonProgress.objects.filter(user=request.user, lesson_id=lesson_id).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # `pk` here is the lesson ID, not the LessonProgress ID
        deleted, _ = LessonProgress.objects.filter(user=request.user, lesson_id=kwargs['pk']).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
