import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export function LoginScreen() {
  const { signIn, skipLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };

      // Handle different error cases
      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/user-cancelled"
      ) {
        // User cancelled or closed popup intentionally, no error shown
        setError(null);
      } else if (error.code === "auth/popup-blocked") {
        setError(
          "Sign-in popup was blocked. Please allow popups and try again.",
        );
      } else if (error.message?.includes("cancelled")) {
        // Catch any other cancellation-related messages
        setError(null);
      } else {
        setError(
          "Sign-in failed. Please check your internet connection and try again.",
        );
        console.error("Sign-in error:", error);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Invoice Generator"
              className="h-16 w-16 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Invoice Generator
          </h1>
          <p className="text-lg text-gray-600">
            Sign in to sync your invoices across devices
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <Button
            onClick={handleSignIn}
            disabled={loading}
            size="lg"
            className="w-full h-14 text-base font-semibold flex items-center justify-center gap-3 bg-black hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in…
              </>
            ) : (
              <>
                {/* Google logo SVG */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                    fill="#ffffff"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <Button
            onClick={skipLogin}
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full h-14 text-base font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Continue Offline (Local Storage)
          </Button>

          <div className="space-y-2 text-sm text-gray-600 text-center">
            <p>
              <span className="font-semibold text-green-600">Cloud Sync:</span>{" "}
              Sign in to sync across devices.
            </p>
            <p>
              <span className="font-semibold text-gray-700">Offline:</span> Work
              locally on this device only.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
