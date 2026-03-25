"""
career_engine.py — Core recommendation logic (no Django dependency).

Scoring fixes applied:
  1. Cosine similarity for interest matching — penalises mismatched interests.
  2. Additive boosts (not multiplicative) — preserves score spread.
  3. 8 specific interest dimensions — properly differentiates within-field careers.
  4. field returned on CareerRecommendation — used by frontend for colour coding.
"""
from dataclasses import dataclass
from typing import Dict, List, Tuple
import math


# ── Interest dimension keys ────────────────────────────────────────────────────
CODING    = "Coding / Software"
AI_ML     = "AI & Machine Learning"
DATA      = "Data & Analytics"
PHYS_MATH = "Physics & Maths"
BIOLOGY   = "Biology"
CHEMISTRY = "Chemistry"
ELEC_HW   = "Electronics & HW"
RESEARCH  = "Research"

ALL_DIMS = [CODING, AI_ML, DATA, PHYS_MATH, BIOLOGY, CHEMISTRY, ELEC_HW, RESEARCH]

# Map subject names → the interest dim that proxies them
SUBJECT_TO_DIM = {
    "Biology":          BIOLOGY,
    "Chemistry":        CHEMISTRY,
    "Physics":          PHYS_MATH,
    "Mathematics":      PHYS_MATH,
    "Computer Science": CODING,
}


@dataclass
class StudentProfile:
    favorite_subjects: List[str]
    interest_areas: Dict[str, int]    # keys from ALL_DIMS, values 1-5
    skills: Dict[str, int]            # values 1-5
    preferred_work_environment: str
    career_goals: List[str]


@dataclass
class Career:
    name: str
    field: str
    required_subjects: List[str]
    preferred_interests: Dict[str, int]   # importance 1-5
    required_skills: Dict[str, int]       # importance 1-5
    work_environment_fit: List[str]
    education_path: str


CAREERS: Dict[str, Career] = {}


def _init_careers() -> None:
    global CAREERS
    CAREERS = {
        # ── CS & IT ─────────────────────────────────────────────────────
        "Software Engineer": Career(
            name="Software Engineer", field="CS & IT",
            required_subjects=["Computer Science", "Mathematics"],
            preferred_interests={CODING: 5, PHYS_MATH: 2},
            required_skills={"Programming": 5, "Problem Solving": 5, "Logical Thinking": 4},
            work_environment_fit=["Office/Tech", "Remote", "Mixed"],
            education_path="B.Tech/B.E. in CS or IT. Build real projects, contribute to open source, complete internships.",
        ),
        "AI Engineer": Career(
            name="AI Engineer", field="CS & IT",
            required_subjects=["Computer Science", "Mathematics"],
            preferred_interests={AI_ML: 5, CODING: 4, DATA: 3, RESEARCH: 3, PHYS_MATH: 3},
            required_skills={"Programming": 5, "Math Aptitude": 5, "Problem Solving": 4},
            work_environment_fit=["Office/Tech", "Research/Lab"],
            education_path="B.Tech in CS with AI specialisation. Study ML frameworks, deep learning, and applied mathematics.",
        ),
        "Data Scientist": Career(
            name="Data Scientist", field="CS & IT",
            required_subjects=["Mathematics", "Computer Science"],
            preferred_interests={DATA: 5, PHYS_MATH: 3, AI_ML: 3, RESEARCH: 3},
            required_skills={"Math Aptitude": 5, "Logical Thinking": 4, "Programming": 4},
            work_environment_fit=["Office/Tech", "Research/Lab"],
            education_path="Bachelor's in CS, Data Science, or Statistics. Master Python, statistics, and ML.",
        ),
        "Web Developer": Career(
            name="Web Developer", field="CS & IT",
            required_subjects=["Computer Science"],
            preferred_interests={CODING: 5},
            required_skills={"Programming": 5, "Problem Solving": 3, "Logical Thinking": 3},
            work_environment_fit=["Office/Tech", "Remote", "Mixed"],
            education_path="Bachelor's in CS/IT or a web bootcamp. Build a strong portfolio across front-end and back-end.",
        ),
        "Cybersecurity Analyst": Career(
            name="Cybersecurity Analyst", field="CS & IT",
            required_subjects=["Computer Science"],
            preferred_interests={CODING: 4, PHYS_MATH: 3, RESEARCH: 2},
            required_skills={"Logical Thinking": 5, "Problem Solving": 4, "Math Aptitude": 3},
            work_environment_fit=["Office/Tech", "Mixed"],
            education_path="Bachelor's in CS/IT. Specialise in network security, ethical hacking, and earn industry certifications.",
        ),
        "Cloud Engineer": Career(
            name="Cloud Engineer", field="CS & IT",
            required_subjects=["Computer Science"],
            preferred_interests={CODING: 4, PHYS_MATH: 2},
            required_skills={"Programming": 3, "Problem Solving": 4, "Logical Thinking": 3},
            work_environment_fit=["Office/Tech", "Remote", "Mixed"],
            education_path="Bachelor's in CS/IT. Earn AWS Solutions Architect, Azure, or GCP certifications.",
        ),
        "Mobile App Developer": Career(
            name="Mobile App Developer", field="CS & IT",
            required_subjects=["Computer Science"],
            preferred_interests={CODING: 5},
            required_skills={"Programming": 5, "Problem Solving": 3, "Logical Thinking": 3},
            work_environment_fit=["Office/Tech", "Remote"],
            education_path="Bachelor's in CS/IT. Build and publish Android/iOS apps; learn Flutter or native SDKs.",
        ),
        # ── Engineering ──────────────────────────────────────────────────
        "Mechanical Engineer": Career(
            name="Mechanical Engineer", field="Engineering",
            required_subjects=["Physics", "Mathematics"],
            preferred_interests={PHYS_MATH: 5},
            required_skills={"Math Aptitude": 5, "Problem Solving": 4, "Logical Thinking": 3},
            work_environment_fit=["Field/On-site", "Office/Tech", "Mixed"],
            education_path="B.Tech/B.E. in Mechanical Engineering. Focus on thermodynamics, design, and manufacturing.",
        ),
        "Civil Engineer": Career(
            name="Civil Engineer", field="Engineering",
            required_subjects=["Physics", "Mathematics"],
            preferred_interests={PHYS_MATH: 4},
            required_skills={"Math Aptitude": 4, "Problem Solving": 4, "Logical Thinking": 3},
            work_environment_fit=["Field/On-site", "Mixed"],
            education_path="B.Tech/B.E. in Civil Engineering. Learn structural analysis, materials science, and construction management.",
        ),
        "Electrical Engineer": Career(
            name="Electrical Engineer", field="Engineering",
            required_subjects=["Physics", "Mathematics"],
            preferred_interests={PHYS_MATH: 5, ELEC_HW: 4},
            required_skills={"Math Aptitude": 5, "Problem Solving": 4, "Logical Thinking": 4},
            work_environment_fit=["Field/On-site", "Office/Tech", "Mixed"],
            education_path="B.Tech/B.E. in Electrical Engineering. Study power systems, circuits, and control theory.",
        ),
        "Electronics Engineer": Career(
            name="Electronics Engineer", field="Engineering",
            required_subjects=["Physics", "Mathematics"],
            preferred_interests={ELEC_HW: 5, PHYS_MATH: 4},
            required_skills={"Math Aptitude": 4, "Problem Solving": 4, "Logical Thinking": 4},
            work_environment_fit=["Office/Tech", "Mixed"],
            education_path="B.Tech/B.E. in Electronics/ECE. Focus on circuits, embedded systems, and signal processing.",
        ),
        "Robotics Engineer": Career(
            name="Robotics Engineer", field="Engineering",
            required_subjects=["Physics", "Mathematics", "Computer Science"],
            preferred_interests={ELEC_HW: 4, CODING: 4, PHYS_MATH: 4, AI_ML: 3},
            required_skills={"Programming": 4, "Math Aptitude": 4, "Problem Solving": 4},
            work_environment_fit=["Office/Tech", "Research/Lab", "Mixed"],
            education_path="B.Tech in Robotics or Mechatronics. Learn control systems, ROS, and embedded programming.",
        ),
        "Aerospace Engineer": Career(
            name="Aerospace Engineer", field="Engineering",
            required_subjects=["Physics", "Mathematics"],
            preferred_interests={PHYS_MATH: 5, RESEARCH: 4},
            required_skills={"Math Aptitude": 5, "Problem Solving": 5, "Logical Thinking": 4},
            work_environment_fit=["Office/Tech", "Research/Lab"],
            education_path="B.Tech in Aerospace or Aeronautical Engineering. Strong grounding in fluid dynamics and structures.",
        ),
        # ── Medical ──────────────────────────────────────────────────────
        "Doctor": Career(
            name="Doctor", field="Medical",
            required_subjects=["Biology", "Chemistry"],
            preferred_interests={BIOLOGY: 5, CHEMISTRY: 3, RESEARCH: 3},
            required_skills={"Communication": 5, "Problem Solving": 5, "Logical Thinking": 4},
            work_environment_fit=["Hospital/Clinical"],
            education_path="MBBS or equivalent medical degree followed by specialisation residency.",
        ),
        "Pharmacist": Career(
            name="Pharmacist", field="Medical",
            required_subjects=["Biology", "Chemistry"],
            preferred_interests={CHEMISTRY: 5, BIOLOGY: 4},
            required_skills={"Logical Thinking": 4, "Communication": 3, "Problem Solving": 3},
            work_environment_fit=["Hospital/Clinical", "Office/Tech"],
            education_path="Bachelor of Pharmacy (B.Pharm). Specialise in pharmacology, drug interactions, and patient safety.",
        ),
        "Dentist": Career(
            name="Dentist", field="Medical",
            required_subjects=["Biology", "Chemistry"],
            preferred_interests={BIOLOGY: 4, CHEMISTRY: 3},
            required_skills={"Communication": 4, "Problem Solving": 3, "Logical Thinking": 3},
            work_environment_fit=["Hospital/Clinical"],
            education_path="Bachelor of Dental Surgery (BDS) or equivalent.",
        ),
        "Nurse": Career(
            name="Nurse", field="Medical",
            required_subjects=["Biology"],
            preferred_interests={BIOLOGY: 5},
            required_skills={"Communication": 5, "Problem Solving": 3, "Logical Thinking": 2},
            work_environment_fit=["Hospital/Clinical"],
            education_path="B.Sc. Nursing or equivalent. Extensive clinical training is essential.",
        ),
        "Medical Lab Scientist": Career(
            name="Medical Lab Scientist", field="Medical",
            required_subjects=["Biology", "Chemistry"],
            preferred_interests={BIOLOGY: 4, CHEMISTRY: 4, RESEARCH: 4},
            required_skills={"Logical Thinking": 5, "Problem Solving": 4, "Math Aptitude": 3},
            work_environment_fit=["Research/Lab", "Hospital/Clinical"],
            education_path="Bachelor's in Medical Laboratory Technology. Precision and analytical thinking are paramount.",
        ),
        "Physiotherapist": Career(
            name="Physiotherapist", field="Medical",
            required_subjects=["Biology"],
            preferred_interests={BIOLOGY: 5},
            required_skills={"Communication": 5, "Problem Solving": 3, "Logical Thinking": 2},
            work_environment_fit=["Hospital/Clinical", "Field/On-site"],
            education_path="Bachelor's in Physiotherapy (BPT). Combine anatomy with hands-on clinical practice.",
        ),
    }


_init_careers()


# ── Scoring functions ──────────────────────────────────────────────────────────

def _subject_score(student: StudentProfile, career: Career) -> float:
    """Partial credit when interest proxy dim >= 3."""
    if not career.required_subjects:
        return 0.7
    fav = set(student.favorite_subjects)
    total = 0.0
    for s in career.required_subjects:
        if s in fav:
            total += 1.0
        else:
            dim_key = SUBJECT_TO_DIM.get(s)
            if dim_key and student.interest_areas.get(dim_key, 0) >= 3:
                total += 0.5
    return total / len(career.required_subjects)


def _interest_score(student: StudentProfile, career: Career) -> float:
    """
    Cosine similarity across ALL 8 dims.
    High student interest in dims the career doesn't value lowers the score
    naturally — no manual penalty needed.
    """
    dot = student_sq = career_sq = 0.0
    for dim in ALL_DIMS:
        sv = student.interest_areas.get(dim, 0) / 5.0
        cv = career.preferred_interests.get(dim, 0) / 5.0
        dot       += sv * cv
        student_sq += sv * sv
        career_sq  += cv * cv

    denom = math.sqrt(student_sq) * math.sqrt(career_sq)
    if denom == 0:
        return 0.4

    cos = dot / denom
    if student.preferred_work_environment in career.work_environment_fit:
        cos = min(1.0, cos + 0.04)
    return cos


def _skill_score(student: StudentProfile, career: Career) -> float:
    if not career.required_skills:
        return 0.5
    num = den = 0.0
    for skill, weight in career.required_skills.items():
        num += weight * (student.skills.get(skill, 0) / 5.0)
        den += weight
    return num / den if den > 0 else 0.5


def _build_boosts(student: StudentProfile) -> Dict[str, float]:
    fav = set(student.favorite_subjects)
    ia  = student.interest_areas
    out: Dict[str, float] = {name: 0.0 for name in CAREERS}

    for name, career in CAREERS.items():
        b = 0.0
        f = career.field
        if "Mathematics"      in fav and f in ("CS & IT", "Engineering"): b += 0.03
        if "Computer Science" in fav and f == "CS & IT":                  b += 0.04
        if "Physics"          in fav and f == "Engineering":              b += 0.04
        if "Biology"          in fav and f == "Medical":                  b += 0.05

        if ia.get(AI_ML,   0) >= 4 and name in ("AI Engineer", "Data Scientist", "Robotics Engineer"):
            b += 0.04
        if ia.get(CODING,  0) >= 4 and f == "CS & IT":
            b += 0.02
        if ia.get(ELEC_HW, 0) >= 4 and name in ("Electrical Engineer", "Electronics Engineer", "Robotics Engineer"):
            b += 0.03

        out[name] = b
    return out


def _build_why(career: Career, s_sub: float, s_int: float, s_skill: float) -> str:
    parts = []
    if    s_sub >= 0.90: parts.append("Your academic subjects are an excellent fit.")
    elif  s_sub >= 0.60: parts.append("You have solid subject foundations for this path.")
    elif  s_sub >= 0.30: parts.append("Some subject gaps exist but can be addressed through study.")
    else:                parts.append("The required subjects differ from your current focus.")

    if    s_int >= 0.85: parts.append("Your interests strongly align with this career.")
    elif  s_int >= 0.65: parts.append("Your interests are well-suited to this field.")
    elif  s_int >= 0.45: parts.append("Your interests partially overlap with this career area.")
    else:                parts.append("This role would stretch your current interest areas.")

    if    s_skill >= 0.85: parts.append("Your skills are a strong match for the role.")
    elif  s_skill >= 0.65: parts.append("Your skill set aligns well with what is needed.")
    elif  s_skill >= 0.40: parts.append("You have a useful skill base to build from.")
    else:                  parts.append("Developing key skills for this role would be important.")

    return " ".join(parts)


@dataclass
class CareerRecommendation:
    career_name: str
    field: str
    score_percent: int      # overall (capped at 99)
    subject_pct: int        # subject sub-score
    interest_pct: int       # interest sub-score
    skill_pct: int          # skill sub-score
    why_suits: str
    required_key_skills: List[str]
    suggested_education_path: str


def recommend_careers(student: StudentProfile, top_n: int = 5) -> List[CareerRecommendation]:
    boosts = _build_boosts(student)
    scored: List[Tuple[float, CareerRecommendation]] = []

    for name, career in CAREERS.items():
        s_sub   = _subject_score(student, career)
        s_int   = _interest_score(student, career)
        s_skill = _skill_score(student, career)

        # Additive boost — never multiplicative — preserves score spread
        raw   = 0.45 * s_sub + 0.35 * s_int + 0.20 * s_skill + boosts.get(name, 0.0)
        score = min(99, int(round(raw * 100)))

        scored.append((
            raw,
            CareerRecommendation(
                career_name=career.name,
                field=career.field,
                score_percent=score,
                subject_pct=min(99, int(round(s_sub   * 100))),
                interest_pct=min(99, int(round(s_int  * 100))),
                skill_pct=min(99,   int(round(s_skill * 100))),
                why_suits=_build_why(career, s_sub, s_int, s_skill),
                required_key_skills=list(career.required_skills.keys()),
                suggested_education_path=career.education_path,
            )
        ))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in scored[:top_n]]
