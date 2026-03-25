import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .career_engine import StudentProfile, recommend_careers
from .serializers import StudentProfileSerializer
from .models import (
    StudentProfile as StudentProfileModel,
    CareerRecommendation as CareerRecommendationModel,
)

logger = logging.getLogger(__name__)


@api_view(["POST"])
def recommend_view(request):
    serializer = StudentProfileSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    student = StudentProfile(
        favorite_subjects=data["favoriteSubjects"],
        interest_areas=data["interestAreas"],
        skills=data["skills"],
        preferred_work_environment=data["preferredWorkEnvironment"],
        career_goals=data["careerGoals"],
    )

    try:
        recs = recommend_careers(student, top_n=5)
    except Exception as exc:
        logger.exception("Career engine error")
        return Response(
            {"detail": f"Recommendation engine error: {exc}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Persist to DB for admin history (non-blocking — errors don't break the API)
    try:
        db_profile = StudentProfileModel.objects.create(
            favorite_subjects=data["favoriteSubjects"],
            interest_areas=data["interestAreas"],
            skills=data["skills"],
            preferred_work_environment=data["preferredWorkEnvironment"],
            career_goals=data["careerGoals"],
        )
        CareerRecommendationModel.objects.bulk_create([
            CareerRecommendationModel(
                student=db_profile,
                career_name=r.career_name,
                matching_score=r.score_percent,
                why_this_career=r.why_suits,
            )
            for r in recs
        ])
    except Exception:
        logger.exception("Failed to persist recommendation to database")

    response_data = [
        {
            "careerName":              r.career_name,
            "field":                   r.field,
            "matchingScore":           r.score_percent,
            "subjectPct":              r.subject_pct,
            "interestPct":             r.interest_pct,
            "skillPct":                r.skill_pct,
            "whyThisCareer":           r.why_suits,
            "requiredKeySkills":       r.required_key_skills,
            "suggestedEducationPath":  r.suggested_education_path,
        }
        for r in recs
    ]

    return Response({"recommendations": response_data}, status=status.HTTP_200_OK)
