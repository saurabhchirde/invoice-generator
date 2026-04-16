import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";
import { FirestoreAdapter } from "./firestoreAdapter";

export type { User as FirebaseUser };

export async function signInWithGoogle(): Promise<void> {
  if (!firebaseAuth) throw new Error("Firebase is not configured");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(firebaseAuth, provider);
  const { user } = result;
  await new FirestoreAdapter(user.uid).upsertUserProfile({
    displayName: user.displayName ?? null,
    email: user.email ?? null,
  });
}

export function signOutUser(): Promise<void> {
  if (!firebaseAuth) return Promise.resolve();
  return signOut(firebaseAuth);
}

export function subscribeToAuthState(
  callback: (user: User | null) => void,
): () => void {
  if (!firebaseAuth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, callback);
}
