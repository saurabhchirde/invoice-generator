import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
      onClose(); // Close modal after successful sign-in
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };

      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/user-cancelled'
      ) {
        setError(null);
      } else if (error.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked. Please allow popups and try again.');
      } else if (error.message?.includes('cancelled')) {
        setError(null);
      } else {
        setError('Sign-in failed. Please check your internet connection and try again.');
        console.error('Sign-in error:', error);
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-4">
          <h2 className="text-2xl font-bold text-gray-900">Sign In to Cloud Sync</h2>
          <p className="text-gray-600 text-sm">
            Sync your invoices across all your devices
          </p>
        </div>

        {/* Sign In Button */}
        <Button
          onClick={handleSignIn}
          disabled={loading}
          size="lg"
          className="w-full h-12 text-base font-semibold flex items-center justify-center gap-3 bg-black hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in…
            </>
          ) : (
            <>
              {/* Google logo SVG */}
              <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#ffffff" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#ffffff" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#ffffff" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#ffffff" />
              </svg>
              Sign in with Google
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Info */}
        <p className="text-center text-xs text-gray-500">
          Your invoices will sync automatically after sign-in
        </p>
      </div>
    </div>
  );
}
