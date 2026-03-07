import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-24">
      <h1 className="text-6xl font-bold text-ora-blue mb-4">404</h1>

      <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4">
        Page introuvable
      </h2>

      <p className="text-slate-600 max-w-md mb-8">
        Oups… La page que vous cherchez n’existe pas ou a été déplacée.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à l’accueil
      </Link>
    </div>
  );
}
