// src/pages/CGV.tsx
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export function CGV() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <FileText className="w-4 h-4" />
            Légal
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Conditions Générales d'Utilisation</h1>
          <p className="text-slate-400">Dernière mise à jour : janvier 2025</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-3xl mx-auto px-4 py-14 space-y-10 text-slate-700">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>Programme entièrement gratuit et bénévole.</strong> L'utilisation du programme ORA
          est libre, gratuite et sans engagement commercial pour les jeunes apprentis comme pour les mentors.
        </div>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Objet</h2>
          <p className="text-sm leading-relaxed">
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
            de la plateforme ORA — Objectif Réussir l'Apprentissage, éditée par l'association
            <strong> Talents Seniors Bénévoles</strong>. En utilisant ce site, vous acceptez sans réserve
            les présentes conditions.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description du service</h2>
          <p className="text-sm leading-relaxed">
            ORA est un programme d'accompagnement bénévole destiné aux jeunes en apprentissage (18–29 ans).
            Il met en relation des jeunes apprentis avec des mentors seniors bénévoles issus du monde professionnel.
            Ce service est <strong>entièrement gratuit</strong> pour toutes les parties.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Accès au service</h2>
          <p className="text-sm leading-relaxed mb-3">
            L'accès au programme est ouvert à toute personne remplissant les conditions suivantes :
          </p>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span><strong>Jeune apprenti(e) :</strong> être âgé(e) de 18 à 29 ans, être en contrat d'apprentissage ou en recherche active, résider dans un département couvert par un pôle ORA.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span><strong>Mentor bénévole :</strong> être retraité ou senior disposant d'une expérience professionnelle significative, s'engager à respecter la charte de bénévolat ORA.</span></li>
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Engagements des utilisateurs</h2>
          <p className="text-sm leading-relaxed mb-3">En utilisant le service, chaque utilisateur s'engage à :</p>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Fournir des informations exactes et sincères lors de l'inscription.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Respecter les autres participants (jeunes, mentors, animateurs).</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Ne pas utiliser le service à des fins commerciales, publicitaires ou illicites.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Signaler tout comportement inapproprié à l'animateur de pôle ou à <a href="mailto:ora@ora.fr" className="text-ora-blue hover:underline">ora@ora.fr</a>.</span></li>
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Confidentialité des échanges</h2>
          <p className="text-sm leading-relaxed">
            Tous les échanges entre un jeune et son mentor sont strictement confidentiels.
            Les animateurs de pôle assurent un suivi de qualité sans interférer dans le contenu
            des échanges, sauf en cas de signalement de comportement inapproprié.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Suspension et exclusion</h2>
          <p className="text-sm leading-relaxed">
            ORA se réserve le droit de suspendre ou d'exclure tout participant dont le comportement
            serait contraire aux présentes CGU, à la charte de bénévolat ou aux lois en vigueur,
            sans préavis ni indemnité.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">7. Responsabilité</h2>
          <p className="text-sm leading-relaxed">
            ORA agit en qualité d'intermédiaire entre jeunes et mentors. L'association ne peut être
            tenue responsable des actes, conseils ou omissions des mentors bénévoles dans le cadre
            de leur accompagnement. La relation de mentorat ne constitue pas une relation de travail
            ni de prestation de service rémunérée.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">8. Modification des CGU</h2>
          <p className="text-sm leading-relaxed">
            ORA se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
            seront informés des modifications significatives par email ou via le site.
            La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles conditions.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">9. Droit applicable</h2>
          <p className="text-sm leading-relaxed">
            Les présentes CGU sont régies par le droit français. En cas de litige, les parties
            s'engagent à rechercher une solution amiable avant tout recours judiciaire.
            À défaut, les tribunaux français seront compétents.
          </p>
        </article>

        <div className="pt-4 flex flex-wrap gap-4">
          <Link to="/mentions-legales" className="inline-flex items-center gap-2 text-sm text-ora-blue hover:underline">
            Mentions légales
          </Link>
          <Link to="/politique-confidentialite" className="inline-flex items-center gap-2 text-sm text-ora-blue hover:underline">
            Politique de confidentialité
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:underline ml-auto">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </section>
    </div>
  );
}
