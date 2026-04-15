import Link from 'next/link';

export default function SignInWithVercelButton() {
  return (
    <Link href="/api/auth/authorize" className="inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
      Sign in with Vercel
    </Link>
  );
}