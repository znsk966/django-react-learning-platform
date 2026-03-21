from rest_framework.routers import DefaultRouter

from .views import LessonViewSet, ModuleViewSet, TagViewSet

router = DefaultRouter()
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'tags',    TagViewSet,    basename='tag')

urlpatterns = router.urls
