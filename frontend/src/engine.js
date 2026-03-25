/**
 * engine.js — Career recommendation engine (JS port of career_engine.py)
 *
 * Fixes applied vs original:
 *   1. Cosine similarity for interest scoring (penalises mismatched interests)
 *   2. Additive boosts, not multiplicative (preserves score spread)
 *   3. 8 specific interest dimensions (properly discriminates within-field careers)
 *   4. `field` included in output (used by frontend for colour coding)
 *   5. Sub-scores (subject/interest/skill) returned for breakdown display
 */

// ── Interest dimension keys ────────────────────────────────────────────────────
export const DIMS = {
  CODE:     "Coding / Software",
  AI:       "AI & Machine Learning",
  DATA:     "Data & Analytics",
  PHYS:     "Physics & Maths",
  BIO:      "Biology",
  CHEM:     "Chemistry",
  ELEC:     "Electronics & HW",
  RESEARCH: "Research",
};
export const ALL_DIMS = Object.values(DIMS);

// Map subject names → interest dim proxy
const SUBJECT_TO_DIM = {
  "Biology":          DIMS.BIO,
  "Chemistry":        DIMS.CHEM,
  "Physics":          DIMS.PHYS,
  "Mathematics":      DIMS.PHYS,
  "Computer Science": DIMS.CODE,
};

// ── Career database ────────────────────────────────────────────────────────────
export const CAREERS = {
  "Software Engineer": {
    name: "Software Engineer", field: "CS & IT",
    required_subjects: ["Computer Science", "Mathematics"],
    preferred_interests: { [DIMS.CODE]: 5, [DIMS.PHYS]: 2 },
    required_skills: { "Programming": 5, "Problem Solving": 5, "Logical Thinking": 4 },
    work_environment_fit: ["Office/Tech", "Remote", "Mixed"],
    education_path: "B.Tech/B.E. in CS or IT. Build real projects, contribute to open source, complete internships.",
  },
  "AI Engineer": {
    name: "AI Engineer", field: "CS & IT",
    required_subjects: ["Computer Science", "Mathematics"],
    preferred_interests: { [DIMS.AI]: 5, [DIMS.CODE]: 4, [DIMS.DATA]: 3, [DIMS.RESEARCH]: 3, [DIMS.PHYS]: 3 },
    required_skills: { "Programming": 5, "Math Aptitude": 5, "Problem Solving": 4 },
    work_environment_fit: ["Office/Tech", "Research/Lab"],
    education_path: "B.Tech in CS with AI specialisation. Study ML frameworks, deep learning, and applied mathematics.",
  },
  "Data Scientist": {
    name: "Data Scientist", field: "CS & IT",
    required_subjects: ["Mathematics", "Computer Science"],
    preferred_interests: { [DIMS.DATA]: 5, [DIMS.PHYS]: 3, [DIMS.AI]: 3, [DIMS.RESEARCH]: 3 },
    required_skills: { "Math Aptitude": 5, "Logical Thinking": 4, "Programming": 4 },
    work_environment_fit: ["Office/Tech", "Research/Lab"],
    education_path: "Bachelor's in CS, Data Science, or Statistics. Master Python, statistics, and ML.",
  },
  "Web Developer": {
    name: "Web Developer", field: "CS & IT",
    required_subjects: ["Computer Science"],
    preferred_interests: { [DIMS.CODE]: 5 },
    required_skills: { "Programming": 5, "Problem Solving": 3, "Logical Thinking": 3 },
    work_environment_fit: ["Office/Tech", "Remote", "Mixed"],
    education_path: "Bachelor's in CS/IT or a web bootcamp. Build a strong portfolio across front-end and back-end.",
  },
  "Cybersecurity Analyst": {
    name: "Cybersecurity Analyst", field: "CS & IT",
    required_subjects: ["Computer Science"],
    preferred_interests: { [DIMS.CODE]: 4, [DIMS.PHYS]: 3, [DIMS.RESEARCH]: 2 },
    required_skills: { "Logical Thinking": 5, "Problem Solving": 4, "Math Aptitude": 3 },
    work_environment_fit: ["Office/Tech", "Mixed"],
    education_path: "Bachelor's in CS/IT. Specialise in network security, ethical hacking, and certifications.",
  },
  "Cloud Engineer": {
    name: "Cloud Engineer", field: "CS & IT",
    required_subjects: ["Computer Science"],
    preferred_interests: { [DIMS.CODE]: 4, [DIMS.PHYS]: 2 },
    required_skills: { "Programming": 3, "Problem Solving": 4, "Logical Thinking": 3 },
    work_environment_fit: ["Office/Tech", "Remote", "Mixed"],
    education_path: "Bachelor's in CS/IT. Earn AWS Solutions Architect, Azure, or GCP certifications.",
  },
  "Mobile App Developer": {
    name: "Mobile App Developer", field: "CS & IT",
    required_subjects: ["Computer Science"],
    preferred_interests: { [DIMS.CODE]: 5 },
    required_skills: { "Programming": 5, "Problem Solving": 3, "Logical Thinking": 3 },
    work_environment_fit: ["Office/Tech", "Remote"],
    education_path: "Bachelor's in CS/IT. Build and publish Android/iOS apps; learn Flutter or native SDKs.",
  },
  "Mechanical Engineer": {
    name: "Mechanical Engineer", field: "Engineering",
    required_subjects: ["Physics", "Mathematics"],
    preferred_interests: { [DIMS.PHYS]: 5 },
    required_skills: { "Math Aptitude": 5, "Problem Solving": 4, "Logical Thinking": 3 },
    work_environment_fit: ["Field/On-site", "Office/Tech", "Mixed"],
    education_path: "B.Tech/B.E. in Mechanical Engineering. Focus on thermodynamics, design, and manufacturing.",
  },
  "Civil Engineer": {
    name: "Civil Engineer", field: "Engineering",
    required_subjects: ["Physics", "Mathematics"],
    preferred_interests: { [DIMS.PHYS]: 4 },
    required_skills: { "Math Aptitude": 4, "Problem Solving": 4, "Logical Thinking": 3 },
    work_environment_fit: ["Field/On-site", "Mixed"],
    education_path: "B.Tech/B.E. in Civil Engineering. Learn structural analysis, materials, and construction management.",
  },
  "Electrical Engineer": {
    name: "Electrical Engineer", field: "Engineering",
    required_subjects: ["Physics", "Mathematics"],
    preferred_interests: { [DIMS.PHYS]: 5, [DIMS.ELEC]: 4 },
    required_skills: { "Math Aptitude": 5, "Problem Solving": 4, "Logical Thinking": 4 },
    work_environment_fit: ["Field/On-site", "Office/Tech", "Mixed"],
    education_path: "B.Tech/B.E. in Electrical Engineering. Study power systems, circuits, and control theory.",
  },
  "Electronics Engineer": {
    name: "Electronics Engineer", field: "Engineering",
    required_subjects: ["Physics", "Mathematics"],
    preferred_interests: { [DIMS.ELEC]: 5, [DIMS.PHYS]: 4 },
    required_skills: { "Math Aptitude": 4, "Problem Solving": 4, "Logical Thinking": 4 },
    work_environment_fit: ["Office/Tech", "Mixed"],
    education_path: "B.Tech/B.E. in Electronics/ECE. Focus on circuits, embedded systems, and signal processing.",
  },
  "Robotics Engineer": {
    name: "Robotics Engineer", field: "Engineering",
    required_subjects: ["Physics", "Mathematics", "Computer Science"],
    preferred_interests: { [DIMS.ELEC]: 4, [DIMS.CODE]: 4, [DIMS.PHYS]: 4, [DIMS.AI]: 3 },
    required_skills: { "Programming": 4, "Math Aptitude": 4, "Problem Solving": 4 },
    work_environment_fit: ["Office/Tech", "Research/Lab", "Mixed"],
    education_path: "B.Tech in Robotics or Mechatronics. Learn control systems, ROS, and embedded programming.",
  },
  "Aerospace Engineer": {
    name: "Aerospace Engineer", field: "Engineering",
    required_subjects: ["Physics", "Mathematics"],
    preferred_interests: { [DIMS.PHYS]: 5, [DIMS.RESEARCH]: 4 },
    required_skills: { "Math Aptitude": 5, "Problem Solving": 5, "Logical Thinking": 4 },
    work_environment_fit: ["Office/Tech", "Research/Lab"],
    education_path: "B.Tech in Aerospace or Aeronautical Engineering. Strong grounding in fluid dynamics and structures.",
  },
  "Doctor": {
    name: "Doctor", field: "Medical",
    required_subjects: ["Biology", "Chemistry"],
    preferred_interests: { [DIMS.BIO]: 5, [DIMS.CHEM]: 3, [DIMS.RESEARCH]: 3 },
    required_skills: { "Communication": 5, "Problem Solving": 5, "Logical Thinking": 4 },
    work_environment_fit: ["Hospital/Clinical"],
    education_path: "MBBS or equivalent medical degree followed by specialisation residency.",
  },
  "Pharmacist": {
    name: "Pharmacist", field: "Medical",
    required_subjects: ["Biology", "Chemistry"],
    preferred_interests: { [DIMS.CHEM]: 5, [DIMS.BIO]: 4 },
    required_skills: { "Logical Thinking": 4, "Communication": 3, "Problem Solving": 3 },
    work_environment_fit: ["Hospital/Clinical", "Office/Tech"],
    education_path: "Bachelor of Pharmacy (B.Pharm). Specialise in pharmacology, drug interactions, and patient safety.",
  },
  "Dentist": {
    name: "Dentist", field: "Medical",
    required_subjects: ["Biology", "Chemistry"],
    preferred_interests: { [DIMS.BIO]: 4, [DIMS.CHEM]: 3 },
    required_skills: { "Communication": 4, "Problem Solving": 3, "Logical Thinking": 3 },
    work_environment_fit: ["Hospital/Clinical"],
    education_path: "Bachelor of Dental Surgery (BDS) or equivalent.",
  },
  "Nurse": {
    name: "Nurse", field: "Medical",
    required_subjects: ["Biology"],
    preferred_interests: { [DIMS.BIO]: 5 },
    required_skills: { "Communication": 5, "Problem Solving": 3, "Logical Thinking": 2 },
    work_environment_fit: ["Hospital/Clinical"],
    education_path: "B.Sc. Nursing or equivalent. Extensive clinical training is essential.",
  },
  "Medical Lab Scientist": {
    name: "Medical Lab Scientist", field: "Medical",
    required_subjects: ["Biology", "Chemistry"],
    preferred_interests: { [DIMS.BIO]: 4, [DIMS.CHEM]: 4, [DIMS.RESEARCH]: 4 },
    required_skills: { "Logical Thinking": 5, "Problem Solving": 4, "Math Aptitude": 3 },
    work_environment_fit: ["Research/Lab", "Hospital/Clinical"],
    education_path: "Bachelor's in Medical Laboratory Technology. Precision and analytical thinking are paramount.",
  },
  "Physiotherapist": {
    name: "Physiotherapist", field: "Medical",
    required_subjects: ["Biology"],
    preferred_interests: { [DIMS.BIO]: 5 },
    required_skills: { "Communication": 5, "Problem Solving": 3, "Logical Thinking": 2 },
    work_environment_fit: ["Hospital/Clinical", "Field/On-site"],
    education_path: "Bachelor's in Physiotherapy (BPT). Combine anatomy with hands-on clinical practice.",
  },
};

// ── Scoring ────────────────────────────────────────────────────────────────────

function subjectScore(profile, career) {
  if (!career.required_subjects.length) return 0.7;
  const fav = new Set(profile.favoriteSubjects);
  let total = 0;
  for (const s of career.required_subjects) {
    if (fav.has(s)) {
      total += 1.0;
    } else {
      const dk = SUBJECT_TO_DIM[s];
      if (dk && (profile.interestAreas[dk] || 0) >= 3) total += 0.5;
    }
  }
  return total / career.required_subjects.length;
}

function interestScore(profile, career) {
  let dot = 0, studentSq = 0, careerSq = 0;
  for (const dim of ALL_DIMS) {
    const sv = (profile.interestAreas[dim] || 0) / 5;
    const cv = (career.preferred_interests[dim] || 0) / 5;
    dot       += sv * cv;
    studentSq += sv * sv;
    careerSq  += cv * cv;
  }
  const denom = Math.sqrt(studentSq) * Math.sqrt(careerSq);
  if (denom === 0) return 0.4;
  let cos = dot / denom;
  if (career.work_environment_fit.includes(profile.preferredWorkEnvironment))
    cos = Math.min(1.0, cos + 0.04);
  return cos;
}

function skillScore(profile, career) {
  const entries = Object.entries(career.required_skills);
  if (!entries.length) return 0.5;
  let num = 0, den = 0;
  for (const [skill, w] of entries) {
    num += w * ((profile.skills[skill] || 0) / 5);
    den += w;
  }
  return den > 0 ? num / den : 0.5;
}

function buildBoosts(profile) {
  const fav = new Set(profile.favoriteSubjects);
  const ia  = profile.interestAreas;
  const out = {};
  for (const name of Object.keys(CAREERS)) {
    const f = CAREERS[name].field;
    let b = 0;
    if (fav.has("Mathematics")      && (f === "CS & IT" || f === "Engineering")) b += 0.03;
    if (fav.has("Computer Science") && f === "CS & IT")                          b += 0.04;
    if (fav.has("Physics")          && f === "Engineering")                      b += 0.04;
    if (fav.has("Biology")          && f === "Medical")                          b += 0.05;
    if ((ia[DIMS.AI]   || 0) >= 4 && ["AI Engineer","Data Scientist","Robotics Engineer"].includes(name)) b += 0.04;
    if ((ia[DIMS.CODE] || 0) >= 4 && f === "CS & IT")  b += 0.02;
    if ((ia[DIMS.ELEC] || 0) >= 4 && ["Electrical Engineer","Electronics Engineer","Robotics Engineer"].includes(name)) b += 0.03;
    out[name] = b;
  }
  return out;
}

function buildWhy(career, sSub, sInt, sSkill) {
  const parts = [];
  if      (sSub >= 0.90) parts.push("Your academic subjects are an excellent fit.");
  else if (sSub >= 0.60) parts.push("You have solid subject foundations for this path.");
  else if (sSub >= 0.30) parts.push("Some subject gaps exist but can be addressed through study.");
  else                   parts.push("The required subjects differ from your current focus.");

  if      (sInt >= 0.85) parts.push("Your interests strongly align with this career.");
  else if (sInt >= 0.65) parts.push("Your interests are well-suited to this field.");
  else if (sInt >= 0.45) parts.push("Your interests partially overlap with this career area.");
  else                   parts.push("This role would stretch your current interest areas.");

  if      (sSkill >= 0.85) parts.push("Your skills are a strong match for the role.");
  else if (sSkill >= 0.65) parts.push("Your skill set aligns well with what is needed.");
  else if (sSkill >= 0.40) parts.push("You have a useful skill base to build from.");
  else                     parts.push("Developing key skills for this role would be important.");

  return parts.join(" ");
}

export function recommendCareers(profile, topN = 5) {
  const boosts = buildBoosts(profile);
  const results = [];

  for (const name of Object.keys(CAREERS)) {
    const career = CAREERS[name];
    const sSub   = subjectScore(profile, career);
    const sInt   = interestScore(profile, career);
    const sSkill = skillScore(profile, career);
    const raw    = 0.45 * sSub + 0.35 * sInt + 0.20 * sSkill + (boosts[name] || 0);

    results.push({
      _raw: raw,
      careerName:            career.name,
      field:                 career.field,
      matchingScore:         Math.min(99, Math.round(raw * 100)),
      subjectPct:            Math.min(99, Math.round(sSub   * 100)),
      interestPct:           Math.min(99, Math.round(sInt   * 100)),
      skillPct:              Math.min(99, Math.round(sSkill * 100)),
      whyThisCareer:         buildWhy(career, sSub, sInt, sSkill),
      requiredKeySkills:     Object.keys(career.required_skills),
      suggestedEducationPath: career.education_path,
    });
  }

  return results
    .sort((a, b) => b._raw - a._raw)
    .slice(0, topN);
}
