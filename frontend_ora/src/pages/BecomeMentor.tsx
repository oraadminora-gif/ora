import { Link } from 'react-router-dom';
import { Users, Heart, Award, TrendingUp, ArrowRight, CheckCircle, Lightbulb } from 'lucide-react';

export function BecomeMentor() {
  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Devenir mentor ORA
          </h1>
          <p className="text-xl text-white/90">
            Transmettez votre expérience et accompagnez un jeune vers la réussite de son apprentissage
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Pourquoi devenir mentor ORA ?
            </h2>
            <p className="text-lg text-slate-700 mb-6">
              Vous êtes retraité ou senior et vous souhaitez donner du sens à votre temps libre ? Devenez <strong>mentor bénévole</strong> avec ORA et accompagnez des jeunes apprentis vers la réussite !
            </p>
            <p className="text-lg text-slate-700 mb-8">
              Les mentors d'ORA sont des <strong>retraités issus de secteurs variés</strong> qui partagent leurs expériences. Chaque parcours permet de partager des conseils concrets, des expériences vécues et sa compréhension du monde du travail.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-ora-blue/10 to-ora-light/10 rounded-xl p-6 border-2 border-ora-blue/20">
              <div className="w-14 h-14 bg-ora-blue rounded-xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Transmission</h3>
              <p className="text-slate-700">
                Transmettez votre connaissance à un jeune désorienté qui demande de l'aide. Partagez votre savoir-être, fruit de votre parcours. L'intergéneration compte pour vous.
              </p>
            </div>

            <div className="bg-gradient-to-br from-ora-green/20 to-ora-green/10 rounded-xl p-6 border-2 border-ora-green/30">
              <div className="w-14 h-14 bg-ora-green rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Enrichissement</h3>
              <p className="text-slate-700">
                Vivez une expérience humaine enrichissante et valorisante. Mettez en avant vos valeurs de bienveillance et d'écoute auprès d'un jeune.
              </p>
            </div>

            <div className="bg-gradient-to-br from-ora-orange/20 to-ora-orange/10 rounded-xl p-6 border-2 border-ora-orange/30">
              <div className="w-14 h-14 bg-ora-orange rounded-xl flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Accompagnement</h3>
              <p className="text-slate-700">
                Accompagnez un jeune dans son parcours d'apprentissage. Aidez-le à surmonter ses difficultés et à gagner en confiance pour réussir.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-ora-orange" />
              Qui sont les mentors ORA ?
            </h2>
            <p className="text-lg text-slate-700 mb-4">
              Les mentors ORA sont des <strong>seniors bénévoles</strong>, tous retraités, attentifs dans notre socièté à la réussite de tous les jeunes et prêts à s'engager à leur échelle et là où ils vivent.Ils sont prêts à donner quelques heures de leur temps pour cela. </p>
            
            <p className="text-lg text-slate-700">
              Tous partagent la même envie : <strong>transmettre leur savoir être</strong> et accompagner des jeunes vers la réussite.
            </p>
          </div>

          <div className="bg-ora-blue/10 rounded-2xl p-8 mb-12 border-2 border-ora-blue/20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Votre rôle en tant que mentor
            </h2>
            <div className="space-y-4 text-slate-700">
              <p className="text-lg">
                En tant que mentor ORA, vous accompagnez <strong>un jeune en apprentissage</strong> de manière personnalisée et bienveillante. Votre rôle est de :
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-ora-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span><strong>Écouter</strong> sans juger : offrir un espace d'écoute bienveillant où le jeune peut s'exprimer librement</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-ora-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span><strong>Conseiller</strong> : partager votre expérience et  vos conseils</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-ora-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span><strong>Encourager</strong> : soutenir le jeune dans ses efforts, renforcer sa confiance en lui</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-ora-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span><strong>Aider à prendre du recul</strong> : l'accompagner dans sa réflexion sur son devenir et ses objectifs</span>
                </li>
              </ul>
              <div className="bg-white rounded-lg p-4 mt-6">
                <p className="text-sm text-slate-600">
                  <strong>Important :</strong> Le mentor n'est pas là pour remplacer le maître d'apprentissage, le formateur ou les parents. Il intervient en complément, dans une relation de confiance et de bienveillance.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Conditions pour devenir mentor
            </h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <span><strong>Être retraité ou senior</strong> avec une expérience professionnelle </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <span><strong>Avoir du temps à consacrer</strong> : environ 2 à 4 heures par mois pour accompagner un jeune</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <span><strong>Faire preuve de bienveillance</strong>, d'écoute et de respect</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <span><strong>Respecter la confidentialité</strong> des échanges avec le jeune</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-ora-blue flex-shrink-0 mt-0.5" />
                <span><strong>S'engager dans notre association</strong> </span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-ora-green/20 to-ora-cyan/20 rounded-2xl p-8 mb-12 border-2 border-ora-green/30">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Vous serez accompagné !
            </h2>
            <p className="text-lg text-slate-700 mb-4">
              ORA vous accompagne tout au long de votre engagement de mentor :
            </p>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-ora-green flex-shrink-0 mt-0.5" />
                <span><strong>Formation initiale</strong> : une formation pour acquérir les clés d'un accompagnement réussi</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-ora-green flex-shrink-0 mt-0.5" />
                <span><strong>Coordonnateur local</strong> : un référent ORA à votre écoute pour vous soutenir</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-ora-green flex-shrink-0 mt-0.5" />
                <span><strong>Ressources et guides</strong> : des outils pratiques pour vous aider dans votre rôle</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-ora-green flex-shrink-0 mt-0.5" />
                <span><strong>Réseau de mentors</strong> : échangez avec d'autres mentors ORA lors de rencontres régulières</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-ora-blue to-ora-dark rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Prêt(e) à devenir mentor ORA ?
            </h2>
            <p className="text-lg text-white/90 mb-6">
              Rejoignez les 300+ mentors bénévoles qui accompagnent des jeunes vers la réussite de leur apprentissage
            </p>
            <Link
              to="/mentors/inscription"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ora-blue rounded-lg font-bold hover:bg-slate-100 transition-colors text-lg"
            >
              Je candidate pour devenir mentor
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
