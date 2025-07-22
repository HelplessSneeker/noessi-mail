import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Zap, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl text-center">
            {/* <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                Modern email client built for productivity.{' '}
                <span className="font-semibold text-brand-600">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Learn more <ArrowRight className="inline h-4 w-4 ml-1" />
                </span>
              </div>
            </div> */}

            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-brand-600 p-3">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Noessi Mail
                </h1>
              </div>
            </div>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              Experience email like never before. Secure, fast, and beautifully
              designed to help you stay organized and productive. Connect all
              your email accounts in one powerful interface.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button size="lg" className="px-8 py-3">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need in an email client
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Powerful features designed to make email management effortless and
              secure.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Shield className="h-5 w-5 flex-none text-brand-600" />
                  Enterprise Security
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Advanced encryption and security protocols keep your
                    communications safe. Built with privacy-first architecture.
                  </p>
                </dd>
              </div>

              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Zap className="h-5 w-5 flex-none text-brand-600" />
                  Lightning Fast
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Optimized for speed with instant search, quick actions, and
                    seamless synchronization across all your devices.
                  </p>
                </dd>
              </div>

              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Users className="h-5 w-5 flex-none text-brand-600" />
                  Multiple Accounts
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Connect Gmail, Outlook, Yahoo, and any IMAP/SMTP provider.
                    Manage all your email accounts from one unified inbox.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to experience better email management?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-brand-100">
              Take control of your inbox with a modern, secure email client
              designed for productivity.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="px-8 py-3">
                  Get Started
                </Button>
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-semibold leading-6 text-white"
              >
                View Dashboard <ArrowRight className="inline h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
