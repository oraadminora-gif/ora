import { Link } from 'react-router-dom';
import { Heart, Shield, Users, Target, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

export function AboutORA() {
  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            ORA, c'est quoi ?
          </h1>
          <p className="text-xl text-white/90">
            Objectif Réussir l'Apprentissage - Un accompagnement sur mesure pour ta réussite
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Des seniors bénévoles au service des apprentis
            </h2>
            <p className="text-lg text-slate-700 mb-6">
              ORA propose un <strong>accompagnement personnalisé, confidentiel et gratuit</strong> pour les jeunes en apprentissage ou en projet d'apprentissage.
            </p>
            <p className="text-lg text-slate-700 mb-8">
              Notre mission : t'accompagner vers la réussite de ton apprentissage grâce au mentorat par des <strong>seniors bénévoles</strong> expérimentés qui partagent leur savoir-faire et leur bienveillance.
            </p>

            <p className="text-lg text-slate-700 mb-8">
              Talents Seniors Bénévoles (TSB) regroupe 4 associations à travers la France qui mettent à disposition leurs bénévoles pour réaliser les mentorats ORA . Merci à elles !
            </p>

          </div>

          <div className="bg-ora-blue/10 rounded-2xl p-8 mb-12 border-2 border-ora-blue/20">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Target className="w-8 h-8 text-ora-blue" />
              Le principe ORA
            </h3>
            <div className="space-y-4 text-lg text-slate-700">
              <p>
                Le mentorat ORA, c'est un <strong>accompagnement intergénérationnel</strong> qui te met en relation avec un mentor bénévole, senior expérimenté, qui va t'écouter, te conseiller et t'accompagner tout au long de ton parcours d'apprentissage.
              </p>
              <p>
                Cet accompagnement est <strong>gratuit</strong>, basé sur la <strong>confiance mutuelle</strong> et s'inscrit dans la <strong>durée</strong> (en moyenne 6 mois à 1 an).
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Les + d'ORA
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-ora-blue hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-ora-blue/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-ora-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Confidentiel</h3>
              <p className="text-slate-700">
                Tes échanges avec ton mentor restent strictement confidentiels. Tu peux parler librement de tes difficultés et de tes projets.
              </p>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-ora-blue hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-ora-blue/20 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-ora-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gratuit</h3>
              <p className="text-slate-700">
                L'accompagnement ORA est 100% gratuit. Aucun frais, aucune cotisation. C'est un service bénévole pour toi.
              </p>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-ora-blue hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-ora-blue/20 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-ora-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Bienveillant</h3>
              <p className="text-slate-700">
                Ton mentor t'écoute sans te juger. Il est là pour te soutenir, t'encourager et te donner confiance en toi.
              </p>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-ora-blue hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-ora-blue/20 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-ora-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Sur mesure</h3>
              <p className="text-slate-700">
                Chaque accompagnement est unique et adapté à tes besoins, ta situation et tes objectifs personnels.
              </p>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-ora-blue hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-ora-blue/20 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-ora-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3"> engagement simple</h3>
              <p className="text-slate-700">
                Tu es libre d'arrêter quand tu veux. Aucune obligation, tu décides du rythme et de la durée.
              </p>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-ora-blue hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-ora-blue/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-ora-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Pour tous</h3>
              <p className="text-slate-700">
                Tous les jeunes sans discrimination en apprentissage ou en projet d'apprentissage peuvent bénéficier d'ORA.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Pourquoi ORA ?
            </h2>
            <div className="space-y-4 text-slate-700">
              <p className="text-lg">
                <strong>ORA est né en 2020 par la volonté des Pouvoirs Publics de voir se développer l'apprentissage : "Passerelle vers l'Emploi".</strong> Rapidement, ils ont pris conscience des risques d'échec et ont mobilisés des acteurs associatifs pour les réduire.
              </p>
              <p className="text-lg">
                En effet, <strong>27% des contrats d'apprentissage sont rompus avant leur terme</strong> (source IGAS). Les raisons sont multiples : difficultés d'adaptation, problèmes relationnels en entreprise, manque de confiance, questions d'orientation...
              </p>
              <p className="text-lg">
                <strong>ORA est bien là pour éviter ces ruptures</strong> en offrant un espace d'écoute, de conseil et d'accompagnement personnalisé par des mentors expérimentés.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-ora-blue to-ora-dark rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Pour qui ?
            </h2>
            <p className="text-xl text-white/90 mb-6">
              ORA s'adresse à <strong>tous les jeunes de 16 à 29 ans</strong> en apprentissage ou en projet d'apprentissage, quel que soit :
            </p>
            <ul className="text-left max-w-2xl mx-auto space-y-2 mb-8 text-lg">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Ton niveau de formation (CAP, Bac Pro, BTS, ...)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Ton secteur d'activité</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Ta situation géographique (ORA est présent dans plus de 40 départements)</span>
              </li>
            </ul>
            <Link
              to="/apprentis/inscription"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ora-blue rounded-lg font-bold hover:bg-slate-100 transition-colors text-lg"
            >
              Je veux être accompagné(e) par un mentor
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
