from django.contrib.auth.models import User
from django.db import models

from content.models import Lesson


class LessonProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'lesson')
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.user.username} — {self.lesson.title}"
