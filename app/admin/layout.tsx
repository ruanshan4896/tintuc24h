'use client';

import { AuthProvider } from '@/lib/contexts/AuthContext';
import AdminProtected from '@/components/AdminProtected';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <AuthProvider>
      {isLoginPage ? (
        children
      ) : (
        <AdminProtected>{children}</AdminProtected>
      )}
    </AuthProvider>
  );
}

