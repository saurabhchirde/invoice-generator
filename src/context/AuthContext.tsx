import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { isFirebaseEnabled } from "../lib/firebase";
import {
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
  FirebaseUser,
} from "../lib/firebaseAuth";

interface AuthContextType {
  user: FirebaseUser | null;
  authLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  skipLogin: () => void;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

const GUEST_FLAG_KEY = "invoice_generator_skip_login";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Only show loading state when Firebase is configured (avoids flashing spinner in sessionStorage mode)
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseEnabled);
  const [isGuest, setIsGuest] = useState(() => {
    if (!isFirebaseEnabled) return false;
    // Check if user previously skipped login
    return sessionStorage.getItem(GUEST_FLAG_KEY) === "true";
  });

  useEffect(() => {
    if (!isFirebaseEnabled) return;
    const unsubscribe = subscribeToAuthState((u) => {
      setUser(u);
      setAuthLoading(false);
      // If user logs in, clear the guest flag and set isGuest to false
      if (u) {
        sessionStorage.removeItem(GUEST_FLAG_KEY);
        setIsGuest(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleSkipLogin = () => {
    sessionStorage.setItem(GUEST_FLAG_KEY, "true");
    setIsGuest(true);
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await signOutUser();
    // When signing out, set guest flag so they don't see login screen again
    sessionStorage.setItem(GUEST_FLAG_KEY, "true");
    setIsGuest(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        signIn: signInWithGoogle,
        signOut: handleSignOut,
        skipLogin: handleSkipLogin,
        isGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
