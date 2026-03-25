"""
run_kaggle_skill.py — Test the engine against the Kaggle career dataset.

FIX: Interest column names from the CSV are now correctly mapped to the
     8 engine dimension keys before being passed to StudentProfile.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend", "recommender"))

import pandas as pd
from career_engine import StudentProfile, recommend_careers, DIMS


# Map Kaggle dataset column names → engine interest dimension keys
KAGGLE_COL_MAP = {
    "Logical-Mathematical": DIMS.PHYS,
    "Linguistic":           None,                # no matching dim — skip
    "Musical":              None,
    "Spatial-Visualization": DIMS.ELEC,
    "Interpersonal":        None,
    "Intrapersonal":        None,
    "Bodily-Kinesthetic":   None,
    "Naturalist":           DIMS.BIO,
}

SUBJECT_COL_MAP = {
    "P1": "Mathematics",
    "P2": "Physics",
    "P3": "Biology",
    "P4": "Chemistry",
    "P5": "Computer Science",
}


def row_to_profile(row: pd.Series) -> StudentProfile:
    # Subjects: column score >= 4 → favourite
    favourite = [
        subj for col, subj in SUBJECT_COL_MAP.items()
        if col in row and row[col] >= 4
    ]

    # Interest areas — only map cols that have a valid engine dim
    interest_areas = {dim: 1 for dim in DIMS.__dict__.values() if not dim.startswith("_")}
    for col, dim in KAGGLE_COL_MAP.items():
        if dim and col in row and not pd.isna(row[col]):
            val = int(row[col])
            # Remap 1-10 scale to 1-5 if needed
            if val > 5:
                val = round(val / 2)
            interest_areas[dim] = max(interest_areas.get(dim, 1), val)

    # Programming column → Coding dim
    if "Programming" in row and not pd.isna(row["Programming"]):
        prog = int(row["Programming"])
        if prog > 5:
            prog = round(prog / 2)
        interest_areas[DIMS.CODE] = max(interest_areas.get(DIMS.CODE, 1), prog)

    skills = {
        "Programming":      interest_areas.get(DIMS.CODE, 1),
        "Problem Solving":  interest_areas.get(DIMS.PHYS, 1),
        "Logical Thinking": interest_areas.get(DIMS.PHYS, 1),
        "Math Aptitude":    interest_areas.get(DIMS.PHYS, 1),
        "Communication":    3,
    }

    env = "Office/Tech"
    if "Preferred_Environment" in row and not pd.isna(row["Preferred_Environment"]):
        env = str(row["Preferred_Environment"])

    return StudentProfile(
        favorite_subjects=favourite,
        interest_areas=interest_areas,
        skills=skills,
        preferred_work_environment=env,
        career_goals=[],
    )


def main():
    csv_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "skill_and_career_recommendation_dataset.csv"
    )
    if not os.path.exists(csv_path):
        print(f"Dataset not found at: {csv_path}")
        print("Place the Kaggle CSV in the data/ folder and re-run.")
        return

    df = pd.read_csv(csv_path)
    for idx, row in df.head(5).iterrows():
        student = row_to_profile(row)
        recs    = recommend_careers(student, top_n=5)
        print(f"\n{'=' * 55}")
        print(f"  STUDENT {idx}")
        print(f"  Subjects: {student.favorite_subjects}")
        print(f"{'=' * 55}")
        for r in recs:
            print(f"  {r.career_name:<30} {r.score_percent:>3}%  [{r.field}]")
            print(f"    Sub {r.subject_pct}% | Int {r.interest_pct}% | Skill {r.skill_pct}%")


if __name__ == "__main__":
    main()
