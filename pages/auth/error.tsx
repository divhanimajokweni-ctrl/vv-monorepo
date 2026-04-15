import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-semibold">Error</h1>
      <p className="mt-4">An error occurred while trying to sign in.</p>
      <Link href="/" className="underline">Back to the home page</Link>
    </div>
  );
}