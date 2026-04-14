import { ReactNode } from "react";
import { isFirebaseEnabled } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "./LoginScreen";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // If Firebase is not configured, render the app directly (localStorage mode)
  if (!isFirebaseEnabled) {
    return <>{children}</>;
  }

  // Firebase is configured — check auth state
  const { user, authLoading, isGuest } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  // User is logged in OR chose to continue as guest
  if (user || isGuest) {
    return <>{children}</>;
  }

  // Show login screen
  return <LoginScreen />;
}
