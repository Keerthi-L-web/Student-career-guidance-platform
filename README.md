# ✨ Career Match Studio

![License](https://img.shields.io/badge/license-MIT-cyan?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)

**Career Match Studio** is a flagship, full-stack decision-support platform designed to give students and professionals an intelligent mapping of their ideal career paths. 

Using an advanced **Cosine-Similarity Recommendation Engine** built on Django, and an exceptionally crafted **Glassmorphism React UI** secured by Firebase, the platform rigorously scores a user's skills and interests across 8 unique dimensions to recommend 21+ highly curated career options in tech, engineering, and science.

---

## 🚀 Key Features

*   **Intelligent Path Mapping:** A powerful backend algorithm evaluates favourite subjects, work environment preferences, and complex slider inputs across 8 core dimensions.
*   **Firebase Authentication Ecosystem:** Fully integrated with Google OAuth & Email/Password login flows cleanly handled by React Context.
*   **Cloud Persistence (Firestore):** Users can save their profiles, sync their career history, and track their assessment journey dynamically in the cloud.
*   **Dynamic Visualizations:** Data-driven user insights using responsive Radar and Bar charts via Recharts.
*   **Premium Glassmorphism UI:** State-of-the-art vanilla CSS design featuring frosted glass aesthetics, glowing cyan accents, deep dark-mode contrasts, and fluid micro-animations.

---

## 🛠️ Technology Stack

### Frontend (React application)
*   **Framework:** React 18 (Hooks, function components, `react-router-dom`)
*   **Auth & Database:** Firebase Authentication + Cloud Firestore
*   **Data Vis:** Recharts (Radar/Bar metrics)
*   **Styling:** Deep Custom Vanilla CSS `App.css` (No UI libs used!)

### Backend (Django REST)
*   **Framework:** Django + Django REST Framework (DRF)
*   **Engine Core:** Pure Python analytical recommender engine using exact matching and weighted cosine similarities.
*   **CORS Management:** Fully decoupled architecture communicating seamlessly with the React frontend.

---

## 📂 Project Structure

```text
career_match_studio/
├── backend/                       # Python/Django API & Recommender Engine
│   ├── manage.py
│   ├── requirements.txt           # Minimal optimized dependencies
│   ├── career_backend/            # Django core settings (CORS, installed apps)
│   └── recommender/               # The Recommendation Application
│       ├── career_engine.py       # Core Cosine-Similarity engine logic
│       ├── views.py               # REST API endpoints (e.g., /api/analyze-profile)
│       └── urls.py                # API routing
│
├── frontend/                      # React SPA
│   ├── package.json
│   └── src/             
│       ├── App.js                 # React Router & Global Layout (Nav)
│       ├── App.css                # Master Stylesheet (Glassmorphism + UI)
│       ├── contexts/              # AuthContext.js (Firebase Auth Provider)
│       ├── firebase/              # Firebase Config & Firestore Service layer
│       └── pages/                 # Full feature views
│           ├── Home.js            # Landing & Features Overview
│           ├── Login.js           # Login View
│           ├── Register.js        # Registration View
│           ├── Dashboard.js       # The Core Assessment Tool
│           ├── History.js         # Cloud-Synced Timeline
│           └── Profile.js         # User Metrics & Radar Charts
│
└── README.md
```

---

## 📦 Local Development Setup

To run this application locally, you will need concurrently running terminals for the frontend and backend.

### 1. Backend Setup

The engine runs on Python 3.9+.

```bash
cd backend
python -m venv venv

# Activate virtual environment
source venv/bin/activate          # macOS/Linux
venv\Scripts\activate             # Windows

# Install required dependencies
pip install -r requirements.txt

# Run migrations and launch the dev server
python manage.py migrate
python manage.py runserver 8000
```
*The Django API is now live and accepting requests at `http://127.0.0.1:8000/api/analyze-profile/`.*

### 2. Frontend Setup

Ensure you have Node.js installed.

```bash
cd frontend

# Install exact node modules
npm install

# Start the frontend dev server
npm start
```
*The React app will launch automatically at `http://localhost:3000` (or 3001) and gracefully proxy unknowns to the backend port 8000.*

### 3. Firebase Configuration (Important)
Since this app uses Firebase, create an `.env` file in the root of the `frontend/` directory with your specific Firebase config keys:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_proj_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

---

## 🧠 How The Engine Works

The Django backend isolates 8 custom dimensions:
`Coding / Software` · `AI & Machine Learning` · `Data & Analytics` · `Physics & Maths` · `Biology` · `Chemistry` · `Electronics & HW` · `Research`

**Scoring Equation:**
`Score = (Subject Weights) + (Cosine Similarity of Interests) + (Skill Averages) + Noise Reduction`

Because self-reported skills are often flawed estimators, the engine gracefully prioritizes raw numerical *interests* against its embedded career vectors using linear algebra, resulting in incredibly hyper-local and shockingly accurate results.

---

*Engineered with precision for the next generation of students. 🚀*
