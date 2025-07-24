import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Zap, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="rounded-full bg-brand-600 p-3 sm:p-4 hover:bg-brand-700 transition-colors duration-300 hover:scale-105 transform transition-transform">
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-gray-900">
                  Noessi Mail
                </h1>
              </div>
            </div>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-xl mx-auto">
              Experience email like never before. Secure, fast, and beautifully
              designed to help you stay organized and productive. Connect all
              your email accounts in one powerful interface.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 transition-all duration-300 hover:scale-105">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 transition-all duration-300 hover:scale-105">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              Everything you need in an email client
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600">
              Powerful features designed to make email management effortless and
              secure.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 card-hover transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Enterprise Security
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Advanced encryption and security protocols keep your
                communications safe. Built with privacy-first architecture.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 card-hover transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Lightning Fast
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Optimized for speed with instant search, quick actions, and
                seamless synchronization across all your devices.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 card-hover transition-all duration-300 hover:shadow-md lg:col-span-1">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Multiple Accounts
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Connect Gmail, Outlook, Yahoo, and any IMAP/SMTP provider.
                Manage all your email accounts from one unified inbox.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-600">
        <div className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Ready to experience better email management?
            </h2>
            <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-brand-100">
              Take control of your inbox with a modern, secure email client
              designed for productivity.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-6 sm:px-8 py-3 transition-all duration-300 hover:scale-105">
                  Get Started
                </Button>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center text-sm font-semibold leading-6 text-white hover:text-brand-100 transition-colors duration-300"
              >
                View Dashboard <ArrowRight className="inline h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
