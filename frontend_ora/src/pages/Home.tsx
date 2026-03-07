import { Link } from "react-router-dom";
import {
  ArrowRight,
  Users,
  Heart,
  Target,
  Shield,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { StatSection } from "../components/StatSection"; // adapte le chemin si besoin

const apprentisBenefits = [
  "Renforcer ta confiance en toi",
  "T'aider dans ton orientation professionnelle",
  "Améliorer ton organisation et ta méthode de travail",
  "Gérer les difficultés en entreprise ou à l'école",
];

const mentorsBenefits = [
  "Transmettre votre expérience professionnelle",
  "Contribuer à l'insertion des jeunes",
  "Vivre une expérience enrichissante et humaine",
  "Donner du sens à votre engagement",
];

export function Home() {
  const stats = [
    { value: 6000, label: "Jeunes accompagnés", suffix: "+" },
    { value: 3000, label: "Mentors bénévoles", suffix: "+" },
    { value: 45, label: "Départements", suffix: "+" },
    { value: 200, label: "Centres actifs", suffix: "+" },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-8 md:py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Colonne Gauche : Texte */}
            <div className="z-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Réussis ton apprentissage grâce au mentorat
              </h1>
              <p className="text-lg md:text-xl mb-6 text-white/90 leading-relaxed">
                Accompagnement personnalisé, confidentiel et gratuit par des
                séniors bénévoles pour les apprentis de 16 à 29 ans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/apprentis/inscription"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ora-orange text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg text-sm md:text-base"
                >
                  Je cherche un mentor
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/mentors/inscription"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-2 border-white rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm md:text-base"
                >
                  Je veux devenir mentor
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Colonne Droite : Photo de mentorat */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-ora-cyan/20 rounded-full blur-3xl"></div>
              <img
                src="/images/image_mentorat.png"
                alt="Deux personnes discutant lors d'une session de mentorat"
                loading="lazy" // Charge l'image seulement quand elle apparaît à l'écran
                /* Changement de aspect-[4/3] en aspect-video pour réduire la hauteur */
                className="relative rounded-2xl shadow-2xl border-4 border-white/10 object-cover aspect-video w-full max-h-[300px]"
              />
              {/* Badge flottant repositionné pour moins d'encombrement */}
              <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-lg shadow-xl flex items-center gap-3">
                <div className="bg-ora-green p-1.5 rounded-full text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-ora-dark font-bold text-xs">
                    Solidarité active
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    Accompagnement local
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION STATISTIQUES AVEC COMPTEURS (nouveau composant) */}
      <StatSection stats={stats} />

      {/* SECTION VALEURS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Nos valeurs
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Un accompagnement bienveillant et adapté à chaque situation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-ora-blue/10 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-ora-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">
                Bienveillant
              </h3>
              <p className="text-slate-600">
                Un accompagnement dans l'écoute, le respect et sans jugement
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-ora-blue/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-ora-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">
                Confidentiel
              </h3>
              <p className="text-slate-600">
                Vos échanges restent privés et sécurisés
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-ora-blue/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-ora-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">
                Sur-mesure
              </h3>
              <p className="text-slate-600">
                Un mentor adapté à vos besoins et votre situation
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-ora-blue/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-ora-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">
                100% Gratuit
              </h3>
              <p className="text-slate-600">
                Un service entièrement gratuit pour tous les jeunes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION APPRENTIS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Pour les apprenti(e)s
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Tu es apprenti(e) et tu rencontres des difficultés ? Tu te poses
                des questions sur ton orientation, ta confiance en toi, ou ton
                organisation ?
              </p>
              <ul className="space-y-3 mb-8">
                {apprentisBenefits.map((benefitApp) => (
                  <li
                    key={benefitApp}
                    className="flex items-start gap-3 text-slate-700"
                  >
                    <div className="w-6 h-6 bg-ora-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-ora-blue rounded-full"></div>
                    </div>
                    <span>{benefitApp}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/apprentis/inscription"
                className="inline-flex items-center gap-2 px-6 py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark transition-colors"
              >
                Je veux être accompagné(e)
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="bg-slate-100 rounded-2xl p-8">
              <div className="aspect-square bg-white rounded-xl shadow-lg flex items-center justify-center">
                <Users className="w-32 h-32 text-ora-blue" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION MENTORS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-slate-100 rounded-2xl p-8">
                <div className="aspect-square bg-white rounded-xl shadow-lg flex items-center justify-center">
                  <Heart className="w-32 h-32 text-ora-blue" />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Pour les mentors
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Vous êtes senior, retraité ou en activité ? Vous souhaitez
                transmettre votre expérience et accompagner un jeune dans sa
                réussite ?
              </p>
              <ul className="space-y-3 mb-8">
                {mentorsBenefits.map((benefitMentor) => (
                  <li
                    key={benefitMentor}
                    className="flex items-start gap-3 text-slate-700"
                  >
                    <div className="w-6 h-6 bg-ora-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-ora-blue rounded-full"></div>
                    </div>
                    <span>{benefitMentor}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/mentors/inscription"
                className="inline-flex items-center gap-2 px-6 py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark transition-colors"
              >
                Je veux devenir mentor
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION PIED DE PAGE / TERRITOIRE */}
      <div className="bg-gradient-to-br from-ora-blue to-ora-dark rounded-2xl p-8 text-white text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <MapPin className="w-16 h-16 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-8">
          Présents sur tout le territoire
        </h2>

        <Link
          to="/implantations"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-ora-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          Voir nos implantations
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
