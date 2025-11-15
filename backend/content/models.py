from django.db import models
from mdeditor.fields import MDTextField

class Module(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class Lesson(models.Model):
    module = models.ForeignKey(Module, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content_md = MDTextField()
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['module', 'order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"