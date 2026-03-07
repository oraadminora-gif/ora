import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img
              src="/image.png"
              alt="ORA"
              className="h-10 brightness-0 invert opacity-90 mb-4"
            />
            <p className="text-slate-400 text-sm">
              Objectif Réussir l&apos;Apprentissage - Accompagnement personnalisé,
              confidentiel et gratuit par des séniors bénévoles.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/apprentis" className="hover:text-white">Je suis apprenti(e)</Link></li>
              <li><Link to="/mentors" className="hover:text-white">Devenir mentor</Link></li>
           
              <li><Link to="/temoignages" className="hover:text-white">Témoignages</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Ressources</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/actualites" className="hover:text-white">Actualités</Link></li>
              <li><Link to="/partenaires" className="hover:text-white">Nos partenaires</Link></li>
              <li><Link to="/implantations" className="hover:text-white">Nos implantations</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
              <li><Link to="/politique-confidentialite" className="hover:text-white">Politique de confidentialité</Link></li>
              <li><Link to="/cgv" className="hover:text-white">CGV</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
          <p>© 2025 ORA - Objectif Réussir l'Apprentissage</p>
          <p>Coordonné par Talents Seniors Bénévoles · Joashams</p>
        </div>
      </div>
    </footer>
  );
}
