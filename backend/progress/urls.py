from rest_framework.routers import DefaultRouter

from .views import LessonProgressViewSet

router = DefaultRouter()
router.register(r'progress', LessonProgressViewSet, basename='progress')

urlpatterns = router.urls
