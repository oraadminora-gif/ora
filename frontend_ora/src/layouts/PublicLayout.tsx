import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';

interface LayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
      </div>

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}
