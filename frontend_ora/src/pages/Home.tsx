import { Link } from "react-router-dom";
import { ArrowRight, MapPin, ShieldCheck, GraduationCap, TrendingUp, UserCheck, HandHeart, Building2, Heart, Lock, SlidersHorizontal, BadgeCheck, Quote } from "lucide-react";
import { StatSection } from "../components/StatSection";
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";

interface PublicStats { total_poles: number; total_departments_covered: number; }

export function Home() {
  const [implantStats, setImplantStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    api.get<PublicStats>('/public/stats/')
      .then(r => setImplantStats(r.data))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => [
    {
      value: 1000,
      label: "Jeunes accompagnés",
      suffix: "+",
      icon: <UserCheck className="w-6 h-6 text-blue-400" />,
      description: "jeunes aidés depuis la création du programme",
      color: "text-blue-400",
    },
    {
      value: 300,
      label: "Mentors bénévoles",
      suffix: "+",
      icon: <HandHeart className="w-6 h-6 text-orange-400" />,
      description: "retraités engagés bénévolement",
      color: "text-orange-400",
    },
    {
      value: implantStats?.total_departments_covered ?? 45,
      label: "Départements",
      suffix: "",
      icon: <MapPin className="w-6 h-6 text-emerald-400" />,
      description: "couverts par un pôle ORA en France",
      color: "text-emerald-400",
    },
    {
      value: implantStats?.total_poles ?? 25,
      label: "Pôles actifs",
      suffix: "",
      icon: <Building2 className="w-6 h-6 text-purple-400" />,
      description: "antennes locales coordonnant les mentorats",
      color: "text-purple-400",
    },
  ], [implantStats]);

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative text-white py-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a3a6e 50%, #0f172a 100%)' }}
      >
        {/* Cercles décoratifs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 60%)', transform: 'translate(-50%, -50%)' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12 md:gap-16">

          {/* Image — gauche */}
          <div className="relative flex-shrink-0 flex items-center justify-center order-1">
            {/* Halo décoratif derrière l'image */}
            <div className="absolute inset-0 scale-110 rounded-3xl blur-2xl opacity-30"
              style={{ background: 'linear-gradient(135deg, #f97316, #3b82f6)' }} />
            <img
              src="/image_hero.png"
              alt="ORA – Objectif Réussir Apprentissage"
              className="relative w-64 md:w-80 lg:w-96 h-auto rounded-3xl shadow-2xl ring-1 ring-white/10"
            />
          </div>

          {/* Texte — droite */}
          <div className="flex-1 text-center md:text-left order-2">
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border border-blue-400/30 text-blue-300 bg-blue-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Gratuit · Bénévole · Confidentiel
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-[1.1] tracking-tight">
              ORA a envie<br />
              <span className="text-ora-orange">
                de te voir réussir.
              </span>
            </h1>

            <p className="text-xl md:text-2xl font-light text-white/50 mb-6 tracking-wide">
              À toi de décider...
            </p>

            <p className="text-base text-white/70 leading-relaxed max-w-lg mb-2">
              Un mentor bénévole, issu du monde professionnel, t'accompagne
              pendant ton apprentissage — de la recherche de contrat jusqu'à
              ton diplôme.
            </p>

            {/* Séparateur minimaliste */}
            <div className="flex items-center gap-3 mt-6 mb-0 justify-center md:justify-start">
              <span className="h-px w-10 bg-orange-400/60" />
              <span className="text-xs text-white/40 uppercase tracking-widest">Objectif Réussir l'Apprentissage</span>
              <span className="h-px w-10 bg-blue-400/60" />
            </div>
          </div>

        </div>
      </section>

      {/* ─── TROIS PORTES ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">

          {/* Tu veux être accompagné(e) — carte fusionnée, col-span-2 */}
          <div className="md:col-span-2 bg-gradient-to-br from-ora-orange/5 to-white rounded-2xl shadow-lg border-t-4 border-ora-orange flex flex-col justify-between p-8 hover:-translate-y-1 transition-transform">
            <div>
              <div className="text-5xl mb-5"></div>
              <h2 className="text-2xl font-bold text-ora-orange mb-3">
                Tu veux être accompagné(e)&nbsp;?
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">
                 ORA te met en relation avec un mentor expérimenté. Un accompagnement personnalisé,
                du premier entretien jusqu'à la validation de ton diplôme.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-ora-orange/15">
                  <span className="text-xl"></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Je m'oriente vers l'apprentissage</p>
                    <p className="text-xs text-slate-500 mt-0.5">Construis ton projet et trouve ton entreprise ou ton CFA avec l'aide d'un mentor.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-ora-orange/15">
                  <span className="text-xl"></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Je suis déjà en apprentissage</p>
                    <p className="text-xs text-slate-500 mt-0.5">Évite les obstacles, booste ta réussite et prépare ton avenir.</p>
                  </div>
                </div>
              </div>
            </div>
            <Link
              to="/ora"
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-ora-orange text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              LE MENTORAT C'EST POUR MOI
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* CFA, Greta, Mentors... — bleu */}
          <div className="bg-white rounded-2xl shadow-lg border-t-4 border-ora-blue flex flex-col justify-between p-8 hover:-translate-y-1 transition-transform">
            <div>
              <div className="text-5xl mb-5"></div>
              <h2 className="text-xl font-bold text-ora-blue mb-3">
                Vous souhaitez prendre contact avec les responsables d'ORA ?
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Vous êtes un particulier qui aimerait nous rejoindre comme mentor ? Vous êtes
                un CFA, un organisme d'apprentissage ou une institution ?
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/mentors"
                className="flex items-center justify-center gap-2 w-full py-3 bg-ora-blue text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Devenir Mentor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#333] text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Autre contact
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── TERRITOIRE ────────────────────────────────────────── */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-6">
            <span className="inline-block mb-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-ora-blue bg-ora-blue/10">
              Implantations
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Présents
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">

            {/* Carte statique cliquable */}
            <div className="w-full md:w-1/2 lg:w-3/5">
              <Link to="/implantations" className="block rounded-2xl overflow-hidden hover:opacity-90 transition-opacity" aria-label="Voir la carte des implantations">
                <img src="/map-france.png" alt="Carte des implantations ORA en France" className="w-full h-auto block" />
              </Link>
            </div>

            {/* Texte + CTA */}
            <div className="w-full md:w-1/2 lg:w-2/5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <MapPin className="w-5 h-5 text-ora-orange" />
                <span className="text-slate-500 text-sm uppercase tracking-widest font-medium">France métropolitaine</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Où que tu sois, un coordonateur est disponible pour te mettre en relation
                avec le mentor adapté à ta situation.
              </p>
              <Link
                to="/implantations"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-ora-blue text-white rounded-full font-semibold text-sm hover:bg-ora-dark transition-colors"
              >
                Trouver mon pôle
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ─── STATISTIQUES ──────────────────────────────────────── */}
      <StatSection stats={stats} />

      {/* ─── POURQUOI ORA ? ────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-ora-blue mb-14">
            Pourquoi choisir l'accompagnement ORA&nbsp;?
          </h2>
          <div className="grid md:grid-cols-3 gap-10">

            <div className="text-center px-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-ora-blue/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-ora-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                le mentorat
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Une formule souple d'accompagnement par un Senior, à ton rythme et adapté
                à tes préoccupations : tu restes moteur de ton parcours et maitre de ton avenir
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-ora-orange/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-ora-orange" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Réussite en vue
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                la formule du mentorat a prouvé son efficacité car ton mentor apprend à te connaitre
                et s'adapte à tes difficultés jusqu'à la réussite de ton projet
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Confiance retrouvée
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                au fil du mentorat et de vos échanges, si tu t'impliques, tu auras en main les conditions
                pour retrouver confiance en toi et voir ton avenir se dessiner plus clairement
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── NOS VALEURS ───────────────────────────────────────── */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Nos valeurs
            </h2>
            <p className="text-slate-500 text-sm">
              Un accompagnement bienveillant et adapté
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">

            <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-rose-100 hover:border-rose-300 hover:shadow-sm transition-all">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Bienveillance</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Écoute, respect et accompagnement sans jugement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Confidentialité</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Vos échanges restent privés et sécurisés
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-violet-100 hover:border-violet-300 hover:shadow-sm transition-all">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Sur mesure</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                Un mentor disponible pour ta demande
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Engagement</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Un service bénévole par des Seniors d'expérience 
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── ILS NOUS SOUTIENNENT / FONT CONFIANCE / TÉMOIGNENT ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-3 gap-6">

            {/* Ils nous soutiennent */}
            <div className="flex flex-col bg-slate-50 rounded-2xl p-6 border-t-4 border-emerald-500 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <HandHeart className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Ils nous soutiennent</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-5">
                Ces partenaires nous financent et nous permettent de pérenniser ORA au profit
                des jeunes apprentis.
              </p>
              <Link
                to="/soutiens"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full font-semibold text-xs hover:bg-emerald-700 transition-colors self-start"
              >
                Voir ceux qui nous soutiennent
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Ils nous font confiance */}
            <div className="flex flex-col bg-slate-50 rounded-2xl p-6 border-t-4 border-ora-blue hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-ora-blue/10 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5 text-ora-blue" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Ils nous font confiance</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-5">
                Ces CFA reconnaissent la qualité et l'efficacité de nos mentorats auprès des
                jeunes de leurs établissements.
              </p>
              <Link
                to="/cfa-partenaires"
                className="inline-flex items-center gap-2 px-4 py-2 bg-ora-blue text-white rounded-full font-semibold text-xs hover:bg-ora-dark transition-colors self-start"
              >
                Voir nos CFA partenaires
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Ils témoignent */}
            <div className="flex flex-col bg-slate-50 rounded-2xl p-6 border-t-4 border-ora-orange hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-ora-orange/10 flex items-center justify-center mb-4">
                <Quote className="w-5 h-5 text-ora-orange" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Ils témoignent</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-5">
                Des jeunes, des mentors et des formateurs dans l'apprentissage témoignent de
                leur satisfaction sur le mentorat ORA.
              </p>
              <Link
                to="/temoignages"
                className="inline-flex items-center gap-2 px-4 py-2 bg-ora-orange text-white rounded-full font-semibold text-xs hover:opacity-90 transition-opacity self-start"
              >
                Voir les témoignages
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
