from django.contrib import admin
from .models import StudentProfile, CareerRecommendation


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display  = ("id", "preferred_work_environment", "created_at")
    readonly_fields = ("created_at",)


@admin.register(CareerRecommendation)
class CareerRecommendationAdmin(admin.ModelAdmin):
    list_display  = ("career_name", "matching_score", "student", "created_at")
    list_filter   = ("career_name",)
    readonly_fields = ("created_at",)
