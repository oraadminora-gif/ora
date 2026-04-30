import { Link } from "react-router-dom";
import { ArrowRight, MapPin, ShieldCheck, GraduationCap, TrendingUp, UserCheck, HandHeart, Building2, Heart, Lock, SlidersHorizontal, BadgeCheck } from "lucide-react";
import { StatSection } from "../components/StatSection";
import { MiniMap } from "../components/MiniMap";
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
        className="relative text-white py-16 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a3a6e 50%, #0f172a 100%)' }}
      >
        {/* Cercles décoratifs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 60%)', transform: 'translate(-50%, -50%)' }} />

        <div className="relative max-w-2xl mx-auto px-4">
          {/* Badge */}
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border border-blue-400/30 text-blue-300 bg-blue-500/10">
            Gratuit · Bénévole · Confidentiel
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight tracking-tight">
           ORA a envie<br className="hidden sm:block" /> de te voir réussir.
          A toi d'en décider</h1>
          <p className="text-base md:text-lg text-white/75 leading-relaxed max-w-xl mx-auto">
            Un mentor bénévole, issu du monde professionnel, t'accompagne
            pendant ton apprentissage — de la recherche de contrat jusqu'à
            ton diplôme.
          </p>
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
              to="/apprentis/inscription"
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
                to="/mentors/inscription"
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
                en vue
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

      {/* ─── TERRITOIRE ────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-10">
            <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-ora-blue bg-ora-blue/10">
              Implantations
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Présents     </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">

            {/* Carte cliquable */}
            <div className="w-full md:w-1/2 lg:w-3/5">
              <MiniMap />
            </div>

            {/* Texte + CTA */}
            <div className="w-full md:w-1/2 lg:w-2/5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <MapPin className="w-5 h-5 text-ora-orange" />
                <span className="text-slate-500 text-sm uppercase tracking-widest font-medium">France métropolitaine</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Où que tu sois, un coordinateur est disponible pour te mettre en relation
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

      {/* ─── TÉMOIGNAGES ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-ora-orange bg-ora-orange/10">
              Ils témoignent
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Ce qu'ils en disent
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Léa */}
            <div className="relative bg-slate-50 rounded-2xl p-6 flex flex-col gap-4 border border-slate-100 hover:shadow-md transition-shadow">
              <span className="text-5xl font-serif leading-none text-ora-orange/30 select-none">"</span>
              <p className="text-slate-700 text-sm leading-relaxed -mt-4">
                Grâce à mon mentor ORA, j'ai repris confiance en moi. J'avais des difficultés
                avec mon maître d'apprentissage et je pensais tout arrêter. Mon mentor m'a
                écoutée et j'ai pu aller jusqu'au bout de mon CAP pâtisserie&nbsp;!
              </p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-9 h-9 rounded-full bg-ora-blue/15 flex items-center justify-center text-ora-blue font-bold text-sm">L</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Léa, 19 ans</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ora-blue/10 text-ora-blue font-medium">Apprentie · Lyon</span>
                </div>
              </div>
            </div>

            {/* Michel */}
            <div className="relative bg-slate-900 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <span className="text-5xl font-serif leading-none text-white/20 select-none">"</span>
              <p className="text-white/80 text-sm leading-relaxed -mt-4">
                Accompagner ces jeunes, leur transmettre mon expérience du monde de l'entreprise,
                les voir grandir et réussir… c'est une expérience incroyablement enrichissante&nbsp;!
              </p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">M</div>
                <div>
                  <p className="font-semibold text-white text-sm">Michel, 68 ans</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">Mentor · Paris</span>
                </div>
              </div>
            </div>

            {/* Thomas */}
            <div className="relative bg-slate-50 rounded-2xl p-6 flex flex-col gap-4 border border-slate-100 hover:shadow-md transition-shadow">
              <span className="text-5xl font-serif leading-none text-ora-orange/30 select-none">"</span>
              <p className="text-slate-700 text-sm leading-relaxed -mt-4">
                Mon mentor m'a aidé à y voir plus clair sur mes objectifs. Aujourd'hui, j'ai
                validé mon BTS et je suis en poste dans l'entreprise où j'étais apprenti&nbsp;!
              </p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-9 h-9 rounded-full bg-ora-blue/15 flex items-center justify-center text-ora-blue font-bold text-sm">T</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Thomas, 20 ans</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ora-blue/10 text-ora-blue font-medium">Apprenti · Lille</span>
                </div>
              </div>
            </div>

          </div>

          <div className="text-center mt-10">
            <Link
              to="/temoignages"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:border-ora-blue hover:text-ora-blue transition-colors"
            >
              Voir tous les témoignages
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
