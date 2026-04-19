import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
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
      value: 6000,
      label: "Jeunes accompagnés",
      suffix: "+",
      icon: "🎓",
      description: "jeunes aidés depuis la création du programme",
      color: "text-blue-400",
    },
    {
      value: 3000,
      label: "Mentors bénévoles",
      suffix: "+",
      icon: "🤝",
      description: "professionnels retraités engagés bénévolement",
      color: "text-orange-400",
    },
    {
      value: implantStats?.total_departments_covered ?? 45,
      label: "Départements",
      suffix: "",
      icon: "📍",
      description: "couverts par un pôle ORA en France",
      color: "text-emerald-400",
    },
    {
      value: implantStats?.total_poles ?? 12,
      label: "Pôles actifs",
      suffix: "",
      icon: "🏢",
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
            Quelqu'un a envie<br className="hidden sm:block" /> de te voir réussir.
          </h1>
          <p className="text-base md:text-lg text-white/75 leading-relaxed max-w-xl mx-auto">
            Des mentors bénévoles, issus du monde professionnel, t'accompagnent
            tout au long de ton apprentissage — de la recherche de contrat jusqu'à
            l'obtention de ton diplôme.
          </p>
        </div>
      </section>

      {/* ─── TROIS PORTES ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">

          {/* Tu veux être accompagné(e) — carte fusionnée, col-span-2 */}
          <div className="md:col-span-2 bg-gradient-to-br from-ora-orange/5 to-white rounded-2xl shadow-lg border-t-4 border-ora-orange flex flex-col justify-between p-8 hover:-translate-y-1 transition-transform">
            <div>
              <div className="text-5xl mb-5">🎓</div>
              <h2 className="text-2xl font-bold text-ora-orange mb-3">
                Tu veux être accompagné(e)&nbsp;?
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">
                Que tu recherches encore ton contrat ou que tu sois déjà en
                apprentissage, ORA te connecte gratuitement à un mentor
                expérimenté de ton secteur. Un accompagnement personnalisé,
                du premier entretien jusqu'à la validation de ton diplôme.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-ora-orange/15">
                  <span className="text-xl">🔍</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Je cherche mon contrat</p>
                    <p className="text-xs text-slate-500 mt-0.5">Construis ton projet et trouve ton entreprise ou ton CFA avec l'aide d'un mentor.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-ora-orange/15">
                  <span className="text-xl">🚀</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Je suis déjà en alternance</p>
                    <p className="text-xs text-slate-500 mt-0.5">Évite les obstacles, booste ta réussite et prépare ton avenir professionnel.</p>
                  </div>
                </div>
              </div>
            </div>
            <Link
              to="/apprentis/inscription"
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-ora-orange text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              JE VEUX UN MENTOR — C'EST GRATUIT
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* CFA, Greta, Mentors... — bleu */}
          <div className="bg-white rounded-2xl shadow-lg border-t-4 border-ora-blue flex flex-col justify-between p-8 hover:-translate-y-1 transition-transform">
            <div>
              <div className="text-5xl mb-5">🤝</div>
              <h2 className="text-xl font-bold text-ora-blue mb-3">
                CFA, Greta, Mentors…
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Vous êtes une institution, une entreprise, ou vous souhaitez
                transmettre votre expérience&nbsp;? Collaborons pour sécuriser
                les parcours professionnels.
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
                Contact Institutionnel
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
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Zéro Décrochage
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Nous agissons comme un bouclier contre les ruptures de contrat
                en offrant une écoute et une médiation rapide entre le jeune et
                l'entreprise.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Réussite Diplômante
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Aide à l'organisation, soutien pédagogique ciblé et préparation
                aux examens pour maximiser les chances d'obtenir le diplôme.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="text-5xl mb-4">💪</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Confiance Boostée
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Développement des "soft skills" et décode des codes de
                l'entreprise pour une intégration durable et sereine dans le
                monde du travail.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── NOS VALEURS ───────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Nos valeurs
            </h2>
            <p className="text-slate-500 text-lg">
              Un accompagnement bienveillant et adapté à chaque situation
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">❤️</div>
              <h3 className="font-bold text-slate-800 mb-2">Bienveillant</h3>
              <p className="text-slate-500 text-sm">
                Un accompagnement dans l'écoute, le respect et sans jugement
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold text-slate-800 mb-2">Confidentiel</h3>
              <p className="text-slate-500 text-sm">
                Vos échanges restent privés et sécurisés
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-slate-800 mb-2">Sur-mesure</h3>
              <p className="text-slate-500 text-sm">
                Un mentor adapté à vos besoins et votre situation
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">💶</div>
              <h3 className="font-bold text-slate-800 mb-2">100% Gratuit</h3>
              <p className="text-slate-500 text-sm">
                Un service entièrement gratuit pour tous les jeunes
              </p>
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
              Présents sur tout le territoire
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a3a6e 60%, #0f172a 100%)' }}
          >
            {/* Cercles déco */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }} />

            <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">

              {/* Chiffres clés */}
              <div className="flex flex-row md:flex-col gap-6 md:gap-4 flex-shrink-0">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-white">
                    {implantStats?.total_departments_covered ?? 45}
                  </p>
                  <p className="text-xs text-white/60 mt-1 uppercase tracking-wide">Départements</p>
                </div>
                <div className="w-px md:w-auto md:h-px bg-white/10 self-stretch md:self-auto" />
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-white">
                    {implantStats?.total_poles ?? 12}
                  </p>
                  <p className="text-xs text-white/60 mt-1 uppercase tracking-wide">Pôles actifs</p>
                </div>
              </div>

              {/* Séparateur vertical */}
              <div className="hidden md:block w-px self-stretch bg-white/10" />

              {/* Texte + CTA */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-ora-orange" />
                  <span className="text-white/60 text-sm uppercase tracking-widest font-medium">France métropolitaine & DOM</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Nos pôles locaux couvrent l'ensemble du territoire national. Où que tu sois,
                  un coordinateur est disponible pour te mettre en relation avec le mentor
                  adapté à ta situation.
                </p>
                <Link
                  to="/implantations"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-ora-blue rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors"
                >
                  Trouver mon pôle
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

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
