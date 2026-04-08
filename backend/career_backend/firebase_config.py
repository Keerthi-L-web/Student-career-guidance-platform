import os
import firebase_admin
from firebase_admin import credentials, firestore

# We check if the default app already exists to avoid re-initializing during hot-reloads
if not firebase_admin._apps:
    try:
        # Expected path to service account key json file
        # You need to generate this from Firebase Console -> Project Settings -> Service Accounts
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin Initialized Successfully")
        else:
            print(f"WARNING: Firebase service account key not found at {cred_path}. Firestore features will fail.")
            # Initialize without creds (for deployment environment if default credentials exist)
            firebase_admin.initialize_app()
    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")

def get_firestore_client():
    try:
        return firestore.client()
    except Exception:
        return None
