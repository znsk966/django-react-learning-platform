from django.db import models
from django.core.validators import MinValueValidator
from mdeditor.fields import MDTextField

class Module(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, max_length=2000)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class Lesson(models.Model):
    module = models.ForeignKey(Module, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content_md = MDTextField()
    order = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    class Meta:
        ordering = ['module', 'order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"