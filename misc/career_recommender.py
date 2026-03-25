"""
Standalone career recommender — can be run independently of Django.
Used for quick testing or Kaggle dataset experiments.

Usage:
    python career_recommender.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend", "recommender"))

from career_engine import StudentProfile, recommend_careers, DIMS


def demo():
    profile = StudentProfile(
        favorite_subjects=["Computer Science", "Mathematics"],
        interest_areas={
            DIMS.CODE:     5,
            DIMS.AI:       4,
            DIMS.DATA:     3,
            DIMS.PHYS:     3,
            DIMS.BIO:      1,
            DIMS.CHEM:     1,
            DIMS.ELEC:     2,
            DIMS.RESEARCH: 2,
        },
        skills={
            "Programming":      5,
            "Problem Solving":  4,
            "Logical Thinking": 4,
            "Math Aptitude":    3,
            "Communication":    3,
        },
        preferred_work_environment="Office/Tech",
        career_goals=["High Salary", "Innovation"],
    )

    recs = recommend_careers(profile, top_n=5)
    print("=" * 60)
    print("  Career Recommendation Engine — Demo Run")
    print("=" * 60)
    for rec in recs:
        print(f"\n  {rec.career_name}  [{rec.field}]  — {rec.score_percent}%")
        print(f"    Subject: {rec.subject_pct}%  |  Interest: {rec.interest_pct}%  |  Skills: {rec.skill_pct}%")
        print(f"    {rec.why_suits}")
        print(f"    Education: {rec.suggested_education_path}")
        print(f"    Key skills: {', '.join(rec.required_key_skills)}")


if __name__ == "__main__":
    demo()
