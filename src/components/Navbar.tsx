'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm bg-opacity-90">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group smooth-transition hover:opacity-70">
            <img
              src="/logo/LOGO I4M PETIT.svg"
              alt="Image4Marketing"
              className="h-10 w-auto"
            />
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : session ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-700 hover:text-black smooth-transition"
                >
                  Mon Profil
                </Link>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    <span className="font-medium text-black">{session.user?.username}</span>
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 smooth-transition"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-black smooth-transition"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 smooth-transition"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
