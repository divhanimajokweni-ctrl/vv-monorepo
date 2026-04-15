'use client';
import { useState } from 'react';

export default function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      window.location.href = '/'; // Redirect to home after sign out
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
    >
      {isPending ? 'Signing out...' : 'Sign out'}
    </button>
  );
}