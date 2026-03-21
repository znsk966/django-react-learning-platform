from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Lesson, Module, Tag

User = get_user_model()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class AuthorSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'slug', 'order', 'content_md', 'module']


class ModuleSerializer(serializers.ModelSerializer):
    lessons       = LessonSerializer(many=True, read_only=True)
    tags          = TagSerializer(many=True, read_only=True)
    author        = AuthorSerializer(read_only=True)
    lesson_count  = serializers.IntegerField(source='lessons.count', read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            'id', 'title', 'slug', 'description',
            'difficulty', 'estimated_duration', 'learning_objectives',
            'thumbnail_url', 'tags', 'author', 'lesson_count',
            'is_published', 'lessons',
        ]

    def get_thumbnail_url(self, obj):
        if not obj.thumbnail:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return obj.thumbnail.url
