import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string | ReactNode;
}

const mentorshipFAQs: FAQItem[] = [
  {
    question: "Qu'est-ce que le mentorat ORA ?",
    answer: "Le mentorat ORA est un accompagnement personnalisé, confidentiel et gratuit proposé aux jeunes en apprentissage. Un mentor bénévole, senior expérimenté, t'accompagne dans ton parcours pour t'aider à surmonter les difficultés et réussir ton apprentissage."
  },
  {
    question: "Combien de temps dure l'accompagnement ?",
    answer: "En moyenne, l'accompagnement dure entre 6 mois et 1 an. Mais c'est toi qui décides ! Tu peux arrêter quand tu veux, sans engagement. L'important est que cet accompagnement te soit utile."
  },
  {
    question: "À quelle fréquence vais-je voir mon mentor ?",
    answer: "En général, tu rencontres ton mentor 1 à 2 fois par mois, selon vos disponibilités respectives. Vous pouvez vous voir en personne, par téléphone ou en visioconférence."
  },
  {
    question: "Est-ce vraiment gratuit ?",
    answer: "Oui ! L'accompagnement ORA est 100% gratuit pour tous les jeunes. Nos mentors sont des bénévoles qui donnent de leur temps par passion de la transmission."
  },
  {
    question: "Mes échanges sont-ils confidentiels ?",
    answer: "Absolument. Tout ce que tu partages avec ton mentor reste strictement confidentiel. Tu peux parler librement de tes difficultés, tes doutes, tes projets."
  },
  {
    question: "Mon mentor va-t-il remplacer mon maître d'apprentissage ou mon formateur ?",
    answer: "Non. Ton mentor n'est pas là pour remplacer ton maître d'apprentissage ou tes formateurs. Il est là en complément, pour t'écouter, te conseiller et te soutenir dans ta globalité (confiance en toi, organisation, relations, orientation...)."
  }
];

const apprenticeshipFAQs: FAQItem[] = [
  {
    question: "Qu'est-ce que l'apprentissage ?",
    answer: (
      <div className="space-y-3">
        <p>L'apprentissage est une formation en alternance qui associe :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Une formation pratique en entreprise</strong> : tu travailles et apprends ton métier avec un maître d'apprentissage</li>
          <li><strong>Une formation théorique en CFA</strong> (Centre de Formation d'Apprentis) : tu suis des cours pour compléter tes compétences</li>
        </ul>
        <p>Tu signes un <strong>contrat d'apprentissage</strong> avec ton employeur, qui t'engage, te forme et te rémunère.</p>
      </div>
    )
  },
  {
    question: "Qui peut devenir apprenti(e) ?",
    answer: (
      <div className="space-y-3">
        <p>L'apprentissage est ouvert aux jeunes de <strong>16 à 29 ans révolus</strong> (sauf exceptions).</p>
        <p><strong>Pas de limite d'âge</strong> pour :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Les apprentis préparant un diplôme supérieur à celui déjà obtenu</li>
          <li>Les travailleurs handicapés</li>
          <li>Les personnes ayant un projet de création/reprise d'entreprise nécessitant le diplôme préparé</li>
          <li>Les sportifs de haut niveau</li>
        </ul>
        <p>À partir de <strong>15 ans</strong>, si tu as terminé ta classe de 3ème.</p>
      </div>
    )
  },
  {
    question: "Quelle est la durée d'un contrat d'apprentissage ?",
    answer: "La durée du contrat varie généralement de 6 mois à 3 ans, selon le diplôme préparé et ton niveau de départ. Elle correspond à la durée du cycle de formation."
  },
  {
    question: "Suis-je rémunéré(e) en apprentissage ?",
    answer: (
      <div className="space-y-3">
        <p>Oui ! En tant qu'apprenti(e), tu es salarié(e) et tu perçois un <strong>salaire</strong> calculé en pourcentage du SMIC (ou du salaire minimum conventionnel).</p>
        <p>Ce pourcentage varie selon :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ton âge</li>
          <li>Ton année d'apprentissage (1ère, 2ème ou 3ème année)</li>
        </ul>
        <p>Par exemple, pour un(e) apprenti(e) de 18 ans en 1ère année, c'est environ 43% du SMIC.</p>
      </div>
    )
  },
  {
    question: "Que faire si mon apprentissage se passe mal ?",
    answer: (
      <div className="space-y-3">
        <p>Si tu rencontres des difficultés, <strong>ne reste pas seul(e)</strong> ! Plusieurs personnes peuvent t'aider :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Ton maître d'apprentissage</strong> : explique-lui tes difficultés, il est là pour t'accompagner</li>
          <li><strong>Ton formateur référent au CFA</strong> : il peut faire le lien avec l'entreprise</li>
          <li><strong>Le médiateur de l'apprentissage</strong> : en cas de conflit, il peut intervenir</li>
          <li><strong>ORA et ton mentor</strong> : un mentor ORA peut t'écouter, te conseiller et t'aider à trouver des solutions</li>
        </ul>
        <p className="font-semibold">N'attends pas que la situation se dégrade. Parles-en rapidement !</p>
      </div>
    )
  },
  {
    question: "Puis-je rompre mon contrat d'apprentissage ?",
    answer: (
      <div className="space-y-3">
        <p>Oui, mais selon des règles précises :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Pendant les 45 premiers jours</strong> (consécutifs ou non) en entreprise : tu peux rompre librement</li>
          <li><strong>Après cette période</strong> : la rupture nécessite un accord entre toi et ton employeur, ou doit passer par un médiateur ou le conseil de prud'hommes</li>
        </ul>
        <p>Avant de rompre, <strong>parles-en à ton CFA et à ORA</strong> : on peut t'aider à trouver des solutions.</p>
      </div>
    )
  },
  {
    question: "Quels sont mes droits et devoirs en tant qu'apprenti(e) ?",
    answer: (
      <div className="space-y-3">
        <p><strong>Tes droits :</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Être formé(e) et encadré(e) par un maître d'apprentissage</li>
          <li>Percevoir un salaire</li>
          <li>Bénéficier des mêmes droits que les autres salariés (congés, protection sociale...)</li>
          <li>Être évalué(e) de façon régulière</li>
        </ul>
        <p className="mt-3"><strong>Tes devoirs :</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Respecter les règles de l'entreprise et du CFA</li>
          <li>Être assidu(e) (présence en entreprise et au CFA)</li>
          <li>Travailler sérieusement pour obtenir ton diplôme</li>
          <li>Respecter les consignes de sécurité</li>
        </ul>
      </div>
    )
  }
];

function FAQSection({ title, faqs }: { title: string; faqs: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">{title}</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-ora-blue transition-colors">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-ora-blue flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-slate-700 leading-relaxed">
                {typeof faq.answer === 'string' ? <p>{faq.answer}</p> : faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <HelpCircle className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Questions fréquentes
            </h1>
          </div>
          <p className="text-xl text-white/90">
            Tout savoir sur le mentorat ORA et l'apprentissage
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FAQSection title="Le mentorat ORA" faqs={mentorshipFAQs} />
          <FAQSection title="L'apprentissage" faqs={apprenticeshipFAQs} />

          <div className="bg-ora-blue rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              Tu as d'autres questions ?
            </h3>
            <p className="text-lg text-white/90 mb-6">
              N'hésite pas à nous contacter ou à faire une demande d'accompagnement. Nous sommes là pour toi !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/apprentis/inscription"
                className="inline-block px-6 py-3 bg-white text-ora-blue rounded-lg font-semibold hover:bg-slate-100 transition-colors"
              >
                Je veux être accompagné(e)
              </a>
              <a
                href="/contact"
                className="inline-block px-6 py-3 bg-ora-dark text-white border-2 border-white rounded-lg font-semibold hover:bg-ora-blue transition-colors"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
