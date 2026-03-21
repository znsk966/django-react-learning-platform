from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from mdeditor.fields import MDTextField


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Module(models.Model):
    BEGINNER     = 'beginner'
    INTERMEDIATE = 'intermediate'
    ADVANCED     = 'advanced'
    DIFFICULTY_CHOICES = [
        (BEGINNER,     'Beginner'),
        (INTERMEDIATE, 'Intermediate'),
        (ADVANCED,     'Advanced'),
    ]

    title                = models.CharField(max_length=200)
    slug                 = models.SlugField(unique=True)
    description          = models.TextField(blank=True, max_length=2000)
    difficulty           = models.CharField(
                               max_length=20, choices=DIFFICULTY_CHOICES,
                               default=BEGINNER, blank=True,
                           )
    estimated_duration   = models.PositiveIntegerField(
                               null=True, blank=True,
                               help_text='Estimated completion time in minutes',
                           )
    learning_objectives  = models.TextField(
                               blank=True,
                               help_text='Markdown list of what learners will achieve',
                           )
    thumbnail            = models.ImageField(
                               upload_to='module_thumbnails/', blank=True, null=True,
                           )
    tags                 = models.ManyToManyField(Tag, blank=True, related_name='modules')
    author               = models.ForeignKey(
                               settings.AUTH_USER_MODEL,
                               null=True, blank=True,
                               on_delete=models.SET_NULL,
                               related_name='authored_modules',
                           )
    is_published         = models.BooleanField(default=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class Lesson(models.Model):
    module     = models.ForeignKey(Module, related_name='lessons', on_delete=models.CASCADE)
    title      = models.CharField(max_length=200)
    slug       = models.SlugField(unique=True)
    content_md = MDTextField()
    order      = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    class Meta:
        ordering = ['module', 'order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"
