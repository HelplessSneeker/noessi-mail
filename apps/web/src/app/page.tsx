import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Noessi Mail</h1>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Register</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Dashboard (Protected)</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
