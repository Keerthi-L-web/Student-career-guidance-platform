# Career Match Studio

AI-powered career guidance for Computer Science, Engineering, and Medical fields.
Uses a cosine-similarity recommendation engine to score 19 careers against a
student's subjects, interests, and skills — with live-updating results.

---

## Project Structure

```
career_match_studio/
├── backend/                        Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── career_backend/             Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   └── recommender/                Core Django app
│       ├── career_engine.py        Recommendation engine (pure Python)
│       ├── models.py               StudentProfile + CareerRecommendation DB models
│       ├── serializers.py          DRF serializer with validation
│       ├── views.py                POST /api/recommend/ endpoint
│       ├── urls.py
│       ├── admin.py
│       └── tests.py                7 API tests
│
├── frontend/                       React app
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/             
│       ├── App.js                  Main app component
│       ├── App.css                 All styles
│       ├── App.test.js             Component tests
│       ├── index.js
│       └── index.css
│
├── misc/
│   ├── career_recommender.py       Standalone demo script
│   └── run_kaggle_skill.py         Kaggle dataset test script
│
│
├── .gitignore
└── README.md
```

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API is now live at `http://127.0.0.1:8000/api/recommend/`

#### Run backend tests
```bash
python manage.py test recommender
```

#### Create admin user (optional — to view saved profiles)
```bash
python manage.py createsuperuser
# Then visit http://127.0.0.1:8000/admin/
```

---

### Frontend

```bash
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`

> The `"proxy": "http://127.0.0.1:8000"` in `package.json` forwards API calls
> to Django automatically in development.

The frontend engine (`engine.js`) runs **entirely in the browser** — the app
works standalone without Django. The Django backend is only needed to persist
recommendation history to the database.

---

## How the Engine Works

### Interest dimensions (8 specific keys)
```
Coding / Software  ·  AI & Machine Learning  ·  Data & Analytics
Physics & Maths    ·  Biology                ·  Chemistry
Electronics & HW   ·  Research
```

### Scoring formula
```
score = 0.45 × subject_score + 0.35 × interest_score + 0.20 × skill_score + boost
```

| Component      | Method                  | Why                                              |
|----------------|-------------------------|--------------------------------------------------|
| subject_score  | Exact match / partial   | Favourite subjects are the strongest discriminator|
| interest_score | **Cosine similarity**   | Penalises mismatched interests naturally          |
| skill_score    | Weighted average        | Skills are self-rated and less reliable           |
| boost          | Small additive (+0–0.05)| Prevents score collapse; preserves spread         |

---
