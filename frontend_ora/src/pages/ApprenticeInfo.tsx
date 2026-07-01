import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, HelpCircle, CircleAlert } from 'lucide-react';

export function ApprenticeInfo() {
  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Tu es apprenti(e) ?
          </h1>
          <p className="text-xl text-ora-blue/10">
            Trouve un mentor qui t'accompagnera vers la réussite
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Pourquoi être accompagné(e) ?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            L'apprentissage est un parcours de formation mais qui peut parfois être difficile. Entre le CFA, l'entreprise, et ta vie personnelle, il n'est pas toujours facile de trouver son équilibre.
          </p>
          <p className="text-lg text-slate-600 mb-8">
            Un mentor est là pour t'écouter, te conseiller et t'aider à surmonter les obstacles que tu rencontres.
          </p>

          <div className="bg-ora-blue/20 rounded-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Un mentor peut t'aider sur :
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Confiance en soi</h4>
                  <p className="text-slate-600 text-sm">Renforce ta confiance et ton estime de toi</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Ta formation</h4>
                  <p className="text-slate-600 text-sm">Renforcer ton projet</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Organisation</h4>
                  <p className="text-slate-600 text-sm">Améliore ta méthode de travail</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Difficultés scolaires</h4>
                  <p className="text-slate-600 text-sm">Trouve des solutions face aux obstacles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Vie en entreprise</h4>
                  <p className="text-slate-600 text-sm">Gère les relations professionnelles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Vie quotidienne</h4>
                  <p className="text-slate-600 text-sm">Équilibre vie pro et vie perso</p>
                </div>
              </div>
            </div>
          </div>


          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            A quoi je m'engage en demandant un mentor ?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Me rendre disponible et ponctuel aux rdv, être franc dans les échanges, volontaire pour réussir mon apprentissage, actif dans ce que vous déciderez ensemble, écouter et prendre conseil.
          </p>


          <div className="bg-slate-50 rounded-xl p-8 mb-12">
            <div className="flex items-start gap-4">
              <CircleAlert className="w-8 h-8 text-ora-blue flex-shrink-0" />
              <div>
               
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Ces conditions d'engagements te permettront de mettre toutes les chances de ton côté pour ta réussite</h4>
                   <h4> Le Mentor de son côté s'engage à tes côtés et son bénévolat témoigne déjà de son engagement. Respecte-le et vous réussirez ensemble ... C'est la clé de ta réussite</h4>
                  </div>
                  
                  
                </div>
              </div>
            </div>
          </div>
         





          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Comment ça marche ?
          </h2>
          <div className="space-y-6 mb-12">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-ora-blue text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Inscris-toi</h3>
                <p className="text-slate-600">Remplis le formulaire d'inscription en quelques minutes</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-ora-blue text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Rencontre ton mentor</h3>
                <p className="text-slate-600">Nous te mettons en relation avec un mentor</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-ora-blue text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Échangez régulièrement</h3>
                <p className="text-slate-600">Rencontrez-vous et échangez selon vos disponibilités</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 mb-12">
            <div className="flex items-start gap-4">
              <HelpCircle className="w-8 h-8 text-ora-blue flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Questions fréquentes
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">C'est vraiment gratuit ?</h4>
                    <p className="text-slate-600">Oui, le mentorat est entièrement gratuit pour tous les jeunes.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Combien de temps dure l'accompagnement ?</h4>
                    <p className="text-slate-600">En général, l'accompagnement dure plusieurs mois : il s'adapte à tes besoins pendant ta formation.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">À quelle fréquence vais-je voir mon mentor ?</h4>
                    <p className="text-slate-600">Vous vous rencontrez regulièrement et selon vos disponibilités respectives.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Mes échanges sont-ils confidentiels ?</h4>
                    <p className="text-slate-600">Oui, tout ce que tu partages avec ton mentor reste strictement confidentiel.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/apprentis/inscription"
              className="inline-flex items-center gap-2 px-8 py-4 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark transition-colors text-lg"
            >
              Tu veux être accompagné(e)
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
