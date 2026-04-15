import { GetServerSideProps } from 'next';
import { parse } from 'cookie';
import SignOutButton from '../components/SignOutButton';

interface User {
  name: string;
  email: string;
  preferred_username: string;
  picture: string;
}

interface ProfileProps {
  user?: User;
  error?: string;
}

export default function Profile({ user, error }: ProfileProps) {
  if (error || !user) {
    return (
      <main className="p-10">
        <h1 className="text-3xl font-semibold">Error</h1>
        <p className="mt-4">{error || 'An error occurred while trying to fetch your profile.'}</p>
        <a href="/" className="underline">Go back to the home page</a> and sign in again.
      </main>
    );
  }

  return (
    <main className="p-10">
      <h1 className="text-3xl font-semibold">Profile</h1>
      <p className="mt-4">
        Welcome to your profile page <strong>{user.name}</strong>.
      </p>
      <div>
        <h2 className="text-xl font-semibold mt-8">User Details</h2>
        <ul className="mt-4">
          <li>
            <strong>Name:</strong> {user.name}
          </li>
          <li>
            <strong>Email:</strong> {user.email}
          </li>
          <li>
            <strong>Username:</strong> {user.preferred_username}
          </li>
          <li>
            <strong>Picture URL:</strong> {user.picture}
          </li>
        </ul>
      </div>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.access_token;

  if (!token) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    const result = await fetch('https://api.vercel.com/login/oauth/userinfo', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (result.status !== 200) {
      throw new Error('Failed to fetch user info');
    }

    const user: User = await result.json();

    return {
      props: { user },
    };
  } catch (error) {
    return {
      props: { error: 'Failed to fetch user information' },
    };
  }
};