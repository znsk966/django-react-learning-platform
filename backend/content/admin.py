from django.contrib import admin
from .models import Module, Lesson

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'description')
    search_fields = ('title', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('title',)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'order', 'slug')
    list_filter = ('module',)
    search_fields = ('title', 'slug', 'module__title')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('module', 'order')