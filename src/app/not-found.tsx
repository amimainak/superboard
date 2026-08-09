import Link from 'next/link';
import { GraduationCap, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
          <GraduationCap className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-sky-500 bg-clip-text text-transparent">404</h1>
        <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
        <p className="text-gray-500 leading-relaxed">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 gradient-primary text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
