// src/pages/MentionsLegales.tsx
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export function MentionsLegales() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Shield className="w-4 h-4" />
            Légal
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Mentions légales</h1>
          <p className="text-slate-400">Dernière mise à jour : janvier 2025</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-3xl mx-auto px-4 py-14 space-y-10 text-slate-700">

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Éditeur du site</h2>
          <p className="text-sm leading-relaxed">
            Le site <strong>ORA — Objectif Réussir l'Apprentissage</strong> est édité par l'association
            <strong> Talents Seniors Bénévoles</strong>, association loi 1901 à but non lucratif.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li><span className="font-medium">Siège social :</span> France</li>
            <li><span className="font-medium">Contact :</span> <a href="mailto:ora@ora.fr" className="text-ora-blue hover:underline">ora@ora.fr</a></li>
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Directeur de la publication</h2>
          <p className="text-sm leading-relaxed">
            Le directeur de la publication est le représentant légal de l'association Talents Seniors Bénévoles.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Hébergement</h2>
          <p className="text-sm leading-relaxed">
            Ce site est hébergé par un prestataire technique. Pour toute question relative à l'hébergement,
            contactez-nous à <a href="mailto:ora@ora.fr" className="text-ora-blue hover:underline">ora@ora.fr</a>.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Propriété intellectuelle</h2>
          <p className="text-sm leading-relaxed">
            L'ensemble des contenus présents sur ce site (textes, images, logos, structure) est la propriété exclusive
            d'ORA – Objectif Réussir l'Apprentissage ou de ses partenaires. Toute reproduction, représentation,
            modification ou diffusion, totale ou partielle, sans autorisation écrite préalable est interdite.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Données personnelles</h2>
          <p className="text-sm leading-relaxed">
            Le traitement des données personnelles collectées sur ce site est décrit dans notre{' '}
            <Link to="/politique-confidentialite" className="text-ora-blue hover:underline font-medium">
              Politique de confidentialité
            </Link>.
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit d'accès,
            de rectification et de suppression de vos données.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Cookies</h2>
          <p className="text-sm leading-relaxed">
            Ce site peut utiliser des cookies techniques nécessaires à son bon fonctionnement.
            Aucun cookie publicitaire ou de traçage tiers n'est utilisé sans votre consentement.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">7. Limitation de responsabilité</h2>
          <p className="text-sm leading-relaxed">
            ORA s'efforce de maintenir les informations publiées à jour et exactes, mais ne peut garantir
            l'exhaustivité ou l'exactitude des contenus. L'association décline toute responsabilité pour
            tout préjudice direct ou indirect résultant de l'utilisation du site.
          </p>
        </article>

        <div className="pt-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-ora-blue hover:underline">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </section>
    </div>
  );
}
