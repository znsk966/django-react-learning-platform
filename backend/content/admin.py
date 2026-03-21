from django.contrib import admin

from .models import Lesson, Module, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display       = ('name', 'slug')
    search_fields      = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering           = ('name',)


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display        = ('title', 'difficulty', 'author', 'estimated_duration', 'is_published', 'slug')
    list_filter         = ('difficulty', 'is_published', 'tags')
    search_fields       = ('title', 'slug', 'author__username', 'author__first_name', 'author__last_name')
    prepopulated_fields = {'slug': ('title',)}
    ordering            = ('title',)
    filter_horizontal   = ('tags',)
    raw_id_fields       = ('author',)
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'is_published'),
        }),
        ('Content', {
            'fields': ('description', 'learning_objectives', 'thumbnail'),
        }),
        ('Metadata', {
            'fields': ('difficulty', 'estimated_duration', 'author', 'tags'),
        }),
    )


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display        = ('title', 'module', 'order', 'slug')
    list_filter         = ('module',)
    search_fields       = ('title', 'slug', 'module__title')
    prepopulated_fields = {'slug': ('title',)}
    ordering            = ('module', 'order')
