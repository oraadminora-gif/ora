// src/pages/PolitiqueConfidentialite.tsx
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

export function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Lock className="w-4 h-4" />
            Légal
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Politique de confidentialité</h1>
          <p className="text-slate-400">Dernière mise à jour : janvier 2025 — conforme RGPD</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-3xl mx-auto px-4 py-14 space-y-10 text-slate-700">

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Responsable du traitement</h2>
          <p className="text-sm leading-relaxed">
            Le responsable du traitement des données est l'association <strong>Talents Seniors Bénévoles</strong>,
            éditrice du programme ORA — Objectif Réussir l'Apprentissage.
            Contact : <a href="mailto:ora@ora.fr" className="text-ora-blue hover:underline">ora@ora.fr</a>
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Données collectées</h2>
          <p className="text-sm leading-relaxed mb-3">Nous collectons uniquement les données nécessaires au bon fonctionnement du programme :</p>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span><strong>Jeunes apprentis :</strong> nom, prénom, email, téléphone, code postal, commune, diplôme préparé, situation, établissement, message de demande.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span><strong>Mentors :</strong> nom, prénom, email, téléphone, code postal, commune, motivation.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span><strong>Membres de l'organisation</strong> (animateurs, coordinateurs) : données de compte, rôle, pôle d'appartenance.</span></li>
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Finalités du traitement</h2>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Mise en relation entre jeunes apprentis et mentors bénévoles.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Suivi et coordination des mentorats par les animateurs de pôle.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Communication par email liée au programme (confirmation, évaluation, clôture).</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Amélioration continue du programme via les évaluations anonymisées.</span></li>
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Base légale</h2>
          <p className="text-sm leading-relaxed">
            Le traitement est fondé sur le <strong>consentement</strong> de la personne concernée
            (formulaire d'inscription) et sur l'<strong>intérêt légitime</strong> de l'association pour
            la coordination du programme de mentorat.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Durée de conservation</h2>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Données de candidature non traitées : <strong>1 an</strong> après le dépôt.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Données de mentorat actif : durée du mentorat + <strong>3 ans</strong> après clôture.</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Comptes membres actifs : durée d'activité + <strong>1 an</strong>.</span></li>
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Destinataires des données</h2>
          <p className="text-sm leading-relaxed">
            Les données sont accessibles uniquement aux membres habilités de l'organisation ORA
            (animateurs de pôle, coordinateurs, coordination nationale) dans le cadre strict de leur mission.
            Aucune donnée n'est vendue ni transmise à des tiers à des fins commerciales.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">7. Vos droits (RGPD)</h2>
          <p className="text-sm leading-relaxed mb-3">Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
          <ul className="text-sm space-y-1 text-slate-600">
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Droit d'<strong>accès</strong> à vos données personnelles</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Droit de <strong>rectification</strong> des données inexactes</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Droit à l'<strong>effacement</strong> (« droit à l'oubli »)</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Droit à la <strong>portabilité</strong> de vos données</span></li>
            <li className="flex items-start gap-2"><span className="text-ora-blue mt-0.5">•</span><span>Droit d'<strong>opposition</strong> au traitement</span></li>
          </ul>
          <p className="text-sm text-slate-600 mt-3">
            Pour exercer ces droits : <a href="mailto:ora@ora.fr" className="text-ora-blue hover:underline">ora@ora.fr</a>.
            En cas de réponse insatisfaisante, vous pouvez saisir la{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-ora-blue hover:underline">CNIL</a>.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-bold text-slate-900 mb-3">8. Sécurité</h2>
          <p className="text-sm leading-relaxed">
            ORA met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données
            contre tout accès non autorisé, perte ou destruction (authentification sécurisée, accès par rôle,
            communications chiffrées via HTTPS).
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
