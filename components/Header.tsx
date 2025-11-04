'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { CATEGORIES, getCategoryNavName } from '@/lib/constants';
import { getCategorySlug } from '@/lib/utils/slug';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  
  // Category icon mapping
  const categoryIcons: { [key: string]: string } = {
    'Công nghệ': '💻',
    'Thể thao': '⚽',
    'Sức khỏe': '❤️',
    'Ô tô': '🚗',
    'Giải trí': '🎬',
    'Game': '🎮',
    'Tin Nóng': '🔥',
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40 will-change-transform">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">📰 Ctrl Z</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
                Trang chủ
              </Link>
              <Link href="/category/tin-nong" className="text-gray-700 hover:text-blue-600 transition">
                Tin Nóng
              </Link>
              {CATEGORIES.filter(cat => cat !== 'Tin Nóng').map((category) => (
                <Link 
                  key={category}
                  href={`/category/${getCategorySlug(category)}`} 
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  {getCategoryNavName(category)}
                </Link>
              ))}
              
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-48 px-3 py-1.5 pr-12 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="Tìm kiếm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-700 hover:text-blue-600 transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Mở menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar Menu */}
      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[110] md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <span id="mobile-menu-title" className="text-xl font-bold text-blue-600">📰 Ctrl Z</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-700 hover:text-gray-900 transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Đóng menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Content */}
        <div className="overflow-y-auto h-full pb-20">
          <div className="flex flex-col p-4 space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition font-medium"
            >
              🏠 Trang chủ
            </Link>

            <div className="pt-2 pb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
                Chuyên mục
              </p>
              <Link
                href="/category/tin-nong"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition flex items-center"
              >
                🔥 Tin Nóng
              </Link>
              {CATEGORIES.filter(cat => cat !== 'Tin Nóng').map((category) => (
                <Link
                  key={category}
                  href={`/category/${getCategorySlug(category)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition flex items-center"
                >
                  {categoryIcons[category] || ''} {getCategoryNavName(category)}
                </Link>
              ))}
            </div>

            {/* Search */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
                Tìm kiếm
              </p>
              <div className="px-4">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm bài viết..."
                    className="w-full px-4 py-3 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Tìm kiếm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

