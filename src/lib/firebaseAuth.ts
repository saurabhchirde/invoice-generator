import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";

export type { User as FirebaseUser };

export function signInWithGoogle(): Promise<void> {
  if (!firebaseAuth) throw new Error("Firebase is not configured");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(firebaseAuth, provider).then(() => undefined);
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
