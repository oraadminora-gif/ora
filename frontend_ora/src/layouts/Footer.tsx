import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Logo + description */}
          <div>
            <Link to="/" className="mb-4 inline-block bg-white rounded-xl px-3 py-2 hover:opacity-85 transition-opacity">
              <img
                src="/image.png"
                alt="ORA"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Objectif Réussir l&apos;Apprentissage — accompagnement personnalisé,
              confidentiel et gratuit par des séniors bénévoles.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/apprentis" className="hover:text-white transition-colors">Je suis apprenti(e)</Link></li>
              <li><Link to="/mentors" className="hover:text-white transition-colors">Devenir mentor</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="font-semibold mb-4">Ressources</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/partenaires" className="hover:text-white transition-colors">Notre réseau associatif</Link></li>
              <li><Link to="/implantations" className="hover:text-white transition-colors">Nos implantations</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link to="/politique-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
              <li><Link to="/cgv" className="hover:text-white transition-colors">CGU</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          <p>© 2026 ORA - Joashams</p>
          <p className="mt-1">Pour Talents Seniors Bénévoles</p>
        </div>
      </div>
    </footer>
  );
}
