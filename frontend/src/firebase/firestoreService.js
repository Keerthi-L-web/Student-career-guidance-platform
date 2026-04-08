import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";

// ── User Profile ─────────────────────────────────────────────────────────────

/**
 * Create or update the user document in Firestore.
 * Called on registration and on profile-save.
 */
export async function saveUserProfile(uid, data) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Fetch the user document.  Returns null if it doesn't exist yet.
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ── Student Profile (detailed academic info) ─────────────────────────────────

/**
 * Save the student's academic profile (subjects, interests, skills …).
 * Stored under  users/{uid}  with a merge so we don't clobber auth fields.
 */
export async function saveStudentProfile(uid, profileData) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      studentProfile: { ...profileData },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Load the detailed student profile.
 */
export async function getStudentProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data().studentProfile || null;
}

// ── Recommendation History ───────────────────────────────────────────────────

/**
 * Persist one recommendation run.
 * Each run becomes a sub-document inside  users/{uid}/history/{auto-id}.
 */
export async function saveRecommendationHistory(
  uid,
  profileSnapshot,
  recommendations
) {
  const histRef = collection(db, "users", uid, "history");
  await addDoc(histRef, {
    profile: profileSnapshot,
    recommendations,
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch all past recommendation sessions, newest first.
 */
export async function getRecommendationHistory(uid) {
  const histRef = collection(db, "users", uid, "history");
  const q = query(histRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
