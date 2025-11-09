'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Image from 'next/image';

export default function ClientPortalNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/client-portal/login');
  };

  const navLinks = [
    { href: '/client-portal/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/client-portal/marketing', label: 'Marketing Materials', icon: '📁' },
  ];

  return (
    <header className="bg-gradient-to-r from-white to-cyan-50 border-b border-cyan-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-8">
            <Link href="/client-portal/dashboard" className="flex items-center gap-3 group">
              <Image
                src="/Gemini_Generated_Image_gxqzr3gxqzr3gxqz (1).png"
                alt="BluePeak Logo"
                width={40}
                height={40}
                className="object-contain transition-transform group-hover:scale-105"
              />
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-cyan-600 bg-clip-text text-transparent">
                  BluePeak
                </h1>
                <span className="text-xs bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-2 py-1 rounded-full font-medium">
                  Client Portal
                </span>
              </div>
            </Link>

            {/* Navigation Links - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500 hover:to-cyan-600 rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-3 pt-2 space-y-1 border-t border-cyan-100 mt-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                    : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
