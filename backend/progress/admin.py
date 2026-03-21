from django.contrib import admin

from .models import LessonProgress


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'completed_at']
    list_filter = ['user', 'lesson__module']
    ordering = ['-completed_at']
