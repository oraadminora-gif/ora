import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'ora_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Petit délai pour ne pas gêner le chargement initial
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50
        bg-white rounded-2xl shadow-2xl border border-slate-100
        animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ora-blue/10 flex items-center justify-center">
            <Cookie className="w-4 h-4 text-ora-blue" />
          </div>
          <p className="font-bold text-slate-900 text-sm">Cookies</p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-2">
        <p className="text-xs text-slate-600 leading-relaxed">
          Ce site utilise uniquement des cookies <strong>techniques essentiels</strong> au
          bon fonctionnement (authentification, session). Aucun cookie publicitaire
          ou de traçage n'est déposé.
        </p>
      </div>

      {/* Badge conformité */}
      <div className="mx-5 my-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <p className="text-[11px] text-emerald-700 font-medium">Conforme RGPD · Aucun traçage tiers</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 pb-4 pt-2">
        <button
          onClick={accept}
          className="flex-1 py-2 bg-ora-blue text-white text-xs font-bold rounded-xl hover:bg-ora-blue/90 transition-colors"
        >
          J'accepte
        </button>
        <Link
          to="/politique-confidentialite"
          onClick={dismiss}
          className="flex-1 py-2 text-center text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          En savoir plus
        </Link>
      </div>
    </div>
  );
}
