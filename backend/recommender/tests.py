from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class RecommendViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("recommend")
        self.valid_payload = {
            "favoriteSubjects": ["Computer Science", "Mathematics"],
            "interestAreas": {
                "Coding / Software": 5,
                "AI & Machine Learning": 4,
                "Data & Analytics": 3,
                "Physics & Maths": 3,
                "Biology": 1,
                "Chemistry": 1,
                "Electronics & HW": 2,
                "Research": 2,
            },
            "skills": {
                "Programming": 5,
                "Problem Solving": 4,
                "Logical Thinking": 4,
                "Math Aptitude": 3,
                "Communication": 3,
            },
            "preferredWorkEnvironment": "Office/Tech",
            "careerGoals": ["High Salary", "Innovation"],
        }

    def test_valid_request_returns_200(self):
        res = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(res.status_code, 200)

    def test_returns_5_recommendations(self):
        res = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(len(res.data["recommendations"]), 5)

    def test_recommendations_have_required_fields(self):
        res = self.client.post(self.url, self.valid_payload, format="json")
        rec = res.data["recommendations"][0]
        for key in ("careerName", "field", "matchingScore", "whyThisCareer",
                    "requiredKeySkills", "suggestedEducationPath"):
            self.assertIn(key, rec)

    def test_scores_are_sorted_descending(self):
        res = self.client.post(self.url, self.valid_payload, format="json")
        scores = [r["matchingScore"] for r in res.data["recommendations"]]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_cs_profile_favours_cs_careers(self):
        res = self.client.post(self.url, self.valid_payload, format="json")
        fields = [r["field"] for r in res.data["recommendations"]]
        self.assertGreater(fields.count("CS & IT"), 2)

    def test_empty_subjects_still_returns_results(self):
        payload = {**self.valid_payload, "favoriteSubjects": []}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, 200)

    def test_invalid_interest_value_returns_400(self):
        payload = {**self.valid_payload,
                   "interestAreas": {"Coding / Software": 9}}   # > 5
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, 400)
