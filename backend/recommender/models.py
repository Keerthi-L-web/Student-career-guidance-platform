from django.db import models


class StudentProfile(models.Model):
    favorite_subjects          = models.JSONField()
    interest_areas             = models.JSONField()
    skills                     = models.JSONField()
    preferred_work_environment = models.CharField(max_length=100)
    career_goals               = models.JSONField(blank=True, null=True)
    created_at                 = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"StudentProfile #{self.id} — {self.created_at:%Y-%m-%d %H:%M}"


class CareerRecommendation(models.Model):
    student         = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="recommendations")
    career_name     = models.CharField(max_length=200)
    matching_score  = models.IntegerField()
    why_this_career = models.TextField()
    created_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.career_name} ({self.matching_score}%)"
