import { useState } from 'react';
import {
  CheckCircle, AlertCircle, Info, Loader2, ArrowRight, Plus, Trash2,
  Mail, MapPin, GraduationCap, Users, Heart, ShieldCheck, Star,
  HandHeart, Quote, TrendingUp, Flame, Lock, BadgeCheck, Download,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Swatch({ name, hex, cls }: { name: string; hex: string; cls: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="group text-left">
      <div className={`h-16 rounded-xl mb-2 ring-1 ring-black/5 transition-transform group-hover:scale-105 ${cls}`} />
      <p className="text-xs font-bold text-slate-800">{name}</p>
      <p className="text-[11px] text-slate-400 font-mono">{copied ? '✓ Copié' : hex}</p>
    </button>
  );
}

function TokenRow({ token, value, desc }: { token: string; value: string; desc: string }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="py-2.5 pr-4 font-mono text-xs text-violet-600 whitespace-nowrap">{token}</td>
      <td className="py-2.5 pr-4 text-xs text-slate-700">{value}</td>
      <td className="py-2.5 text-xs text-slate-400">{desc}</td>
    </tr>
  );
}

function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24" style={{ breakBefore: id !== 'couleurs' ? 'page' : 'auto' }}>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
        {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
        <div className="h-px bg-gradient-to-r from-ora-blue/40 to-transparent mt-3" />
      </div>
      {children}
    </section>
  );
}

function Block({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="charte-block mb-8" style={{ breakInside: 'avoid' }}>
      {title && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>}
      {children}
    </div>
  );
}

// ─── Données ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'couleurs',     label: 'Couleurs'      },
  { id: 'typographie',  label: 'Typographie'   },
  { id: 'boutons',      label: 'Boutons'       },
  { id: 'badges',       label: 'Badges'        },
  { id: 'cartes',       label: 'Cartes'        },
  { id: 'formulaires',  label: 'Formulaires'   },
  { id: 'icones',       label: 'Icônes'        },
  { id: 'alertes',      label: 'Alertes'       },
  { id: 'layout',       label: 'Layout'        },
];

const PALETTE_ORA = [
  { name: 'ORA Blue',  hex: '#003DA5', cls: 'bg-ora-blue'  },
  { name: 'ORA Dark',  hex: '#002A75', cls: 'bg-ora-dark'  },
  { name: 'ORA Light', hex: '#0052D9', cls: 'bg-ora-light' },
  { name: 'ORA Orange',hex: '#F05A28', cls: 'bg-ora-orange'},
  { name: 'ORA Green', hex: '#B8D430', cls: 'bg-ora-green' },
  { name: 'ORA Cyan',  hex: '#8DC8E8', cls: 'bg-ora-cyan'  },
];

const PALETTE_NEUTRAL = [
  { name: 'Slate 900', hex: '#0f172a', cls: 'bg-slate-900' },
  { name: 'Slate 700', hex: '#334155', cls: 'bg-slate-700' },
  { name: 'Slate 500', hex: '#64748b', cls: 'bg-slate-500' },
  { name: 'Slate 300', hex: '#cbd5e1', cls: 'bg-slate-300' },
  { name: 'Slate 100', hex: '#f1f5f9', cls: 'bg-slate-100 ring-1 ring-slate-200' },
  { name: 'White',     hex: '#ffffff', cls: 'bg-white ring-1 ring-slate-200'     },
];

const PALETTE_SEMANTIC = [
  { name: 'Succès',     hex: '#10b981', cls: 'bg-emerald-500' },
  { name: 'Erreur',     hex: '#ef4444', cls: 'bg-red-500'     },
  { name: 'Attention',  hex: '#f59e0b', cls: 'bg-amber-400'   },
  { name: 'Info',       hex: '#3b82f6', cls: 'bg-blue-500'    },
  { name: 'ACP/Admin',  hex: '#7c3aed', cls: 'bg-violet-600'  },
  { name: 'Secondaire', hex: '#0ea5e9', cls: 'bg-sky-500'     },
];

const TYPE_SCALE = [
  { cls: 'text-6xl font-extrabold', size: '64px / 4rem',  weight: 'ExtraBold 800', usage: 'Hero principal'     },
  { cls: 'text-5xl font-extrabold', size: '48px / 3rem',  weight: 'ExtraBold 800', usage: 'Titre page'         },
  { cls: 'text-4xl font-bold',      size: '36px / 2.25rem',weight: 'Bold 700',     usage: 'Titre section'      },
  { cls: 'text-3xl font-bold',      size: '30px / 1.875rem',weight: 'Bold 700',    usage: 'Titre dashboard'    },
  { cls: 'text-2xl font-bold',      size: '24px / 1.5rem', weight: 'Bold 700',     usage: 'Titre carte'        },
  { cls: 'text-xl font-semibold',   size: '20px / 1.25rem',weight: 'SemiBold 600', usage: 'Sous-titre'         },
  { cls: 'text-lg font-medium',     size: '18px / 1.125rem',weight: 'Medium 500',  usage: 'Texte mis en avant' },
  { cls: 'text-base',               size: '16px / 1rem',   weight: 'Regular 400',  usage: 'Corps de texte'     },
  { cls: 'text-sm',                 size: '14px / 0.875rem',weight: 'Regular 400', usage: 'Texte secondaire'   },
  { cls: 'text-xs font-semibold',   size: '12px / 0.75rem',weight: 'SemiBold 600', usage: 'Label / badge'      },
];

const INPUT_CLS = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

// ─── Composant principal ──────────────────────────────────────────────────────

export function CharteGraphique() {
  const [activeNav, setActiveNav] = useState('couleurs');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveNav(id);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div
        id="charte-hero"
        className="text-white py-16 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a3a6e 50%, #0f172a 100%)' }}
      >
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border border-blue-400/30 text-blue-300 bg-blue-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Design System
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Charte Graphique <span className="text-ora-orange">ORA</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Référentiel visuel officiel — couleurs, typographie, composants et règles
            d'usage pour une interface cohérente et accessible.
          </p>
          <div className="flex items-center justify-between mt-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-ora-orange/60" />
              <span className="text-xs text-white/40 uppercase tracking-widest">Objectif Réussir l'Apprentissage</span>
              <span className="h-px w-10 bg-blue-400/40" />
            </div>
            <button
              id="charte-print-btn"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter en PDF
            </button>
          </div>
        </div>
      </div>

      <div id="charte-content" className="max-w-5xl mx-auto px-6 flex gap-10 py-12">

        {/* ── Nav latérale sticky ── */}
        <aside id="charte-sidebar" className="hidden lg:block w-44 shrink-0">
          <nav className="sticky top-24 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sections</p>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeNav === item.id
                    ? 'bg-ora-blue/8 text-ora-blue font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Contenu ── */}
        <main id="charte-main" className="flex-1 space-y-16 min-w-0">

          {/* ─────────── COULEURS ─────────── */}
          <Section id="couleurs" title="Couleurs" sub="Palette officielle ORA — 6 couleurs de marque + sémantique">

            <Block title="Palette de marque">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {PALETTE_ORA.map(s => <Swatch key={s.name} {...s} />)}
              </div>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 space-y-1">
                <p><span className="font-semibold text-ora-blue">ORA Blue #003DA5</span> — Couleur primaire. Boutons, liens, actifs, focus rings.</p>
                <p><span className="font-semibold text-ora-dark">ORA Dark #002A75</span> — Hover et états enfoncés du bleu primaire.</p>
                <p><span className="font-semibold text-ora-orange">ORA Orange #F05A28</span> — Accent secondaire. CTA forts, badges attention, titres héros.</p>
                <p><span className="font-semibold" style={{ color: '#B8D430' }}>ORA Green #B8D430</span> — Accent tertiaire. Indicateurs positifs, tags.</p>
              </div>
            </Block>

            <Block title="Palette neutre (Slate)">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {PALETTE_NEUTRAL.map(s => <Swatch key={s.name} {...s} />)}
              </div>
            </Block>

            <Block title="Couleurs sémantiques">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {PALETTE_SEMANTIC.map(s => <Swatch key={s.name} {...s} />)}
              </div>
            </Block>

            <Block title="Gradients">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Hero principal',    cls: '',       style: { background: 'linear-gradient(135deg, #0f172a 0%, #1a3a6e 50%, #0f172a 100%)' } },
                  { label: 'Hero page',         cls: '',       style: { background: 'linear-gradient(135deg, #003DA5, #002A75, #0f172a)' } },
                  { label: 'Carte apprenti',    cls: 'bg-gradient-to-br from-ora-orange/10 to-white', style: {} },
                  { label: 'Stats / sombre',    cls: '',       style: { background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' } },
                ].map(g => (
                  <div key={g.label} className={`h-20 rounded-xl flex items-end px-4 pb-3 ring-1 ring-black/5 ${g.cls}`} style={g.style}>
                    <span className="text-xs font-semibold text-white/80 drop-shadow">{g.label}</span>
                  </div>
                ))}
              </div>
            </Block>
          </Section>

          {/* ─────────── TYPOGRAPHIE ─────────── */}
          <Section id="typographie" title="Typographie" sub="Open Sans — système d'échelle modulaire">

            <Block title="Police principale">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">Open Sans</p>
                <p className="text-sm text-slate-400">Google Fonts — Regular 400 · Medium 500 · SemiBold 600 · Bold 700 · ExtraBold 800 · Black 900</p>
                <p className="mt-4 text-slate-700 leading-relaxed max-w-xl">
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                  abcdefghijklmnopqrstuvwxyz<br />
                  0123456789 — éàüîôç @ ! ? & #
                </p>
              </div>
            </Block>

            <Block title="Échelle typographique">
              <div className="space-y-4">
                {TYPE_SCALE.map((t) => (
                  <div key={t.cls} className="flex items-baseline gap-4 py-3 border-b border-slate-100">
                    <p className={`${t.cls} text-slate-900 leading-none shrink-0`} style={{ lineHeight: 1 }}>
                      Aa
                    </p>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-violet-600">{t.cls}</p>
                      <p className="text-[11px] text-slate-400">{t.size} · {t.weight} · {t.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Block>

            <Block title="Tokens de style">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pr-4">Token</th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pr-4">Valeur</th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TokenRow token="tracking-tight"   value="-0.015em" desc="Titres héros, grands affichages" />
                    <TokenRow token="tracking-widest"  value="0.1em"    desc="Labels uppercase, badges, nav" />
                    <TokenRow token="leading-relaxed"  value="1.625"    desc="Paragraphes, descriptions" />
                    <TokenRow token="leading-tight"    value="1.25"     desc="Titres multilignes" />
                    <TokenRow token="leading-none"     value="1"        desc="Compteurs statistiques" />
                  </tbody>
                </table>
              </div>
            </Block>
          </Section>

          {/* ─────────── BOUTONS ─────────── */}
          <Section id="boutons" title="Boutons" sub="4 niveaux hiérarchiques — utilisez le bon selon le contexte">

            <Block title="Boutons principaux (CTA)">
              <div className="flex flex-wrap gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <button className="px-6 py-2.5 bg-ora-blue text-white rounded-full font-semibold text-sm hover:bg-ora-dark transition-colors flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Primaire Blue
                </button>
                <button className="px-6 py-2.5 bg-ora-orange text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Primaire Orange
                </button>
                <button className="px-6 py-2.5 bg-violet-600 text-white rounded-full font-semibold text-sm hover:bg-violet-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Admin / ACP
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 px-1">Usage : actions principales de la page. Un seul CTA primaire visible par section.</p>
            </Block>

            <Block title="Boutons secondaires">
              <div className="flex flex-wrap gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <button className="px-6 py-2.5 border-2 border-ora-blue text-ora-blue rounded-full font-semibold text-sm hover:bg-ora-blue/5 transition-colors">
                  Secondaire outline
                </button>
                <button className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-full font-semibold text-sm hover:bg-slate-100 transition-colors">
                  Secondaire neutre
                </button>
                <button className="px-6 py-2.5 border-2 border-white text-white rounded-full font-semibold text-sm hover:bg-white/10 transition-colors" style={{ background: 'transparent' }}>
                  <span className="text-ora-blue">Outline</span> (sur clair)
                </button>
              </div>
            </Block>

            <Block title="Boutons ghost & icônes">
              <div className="flex flex-wrap gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <button className="p-2 rounded-lg text-slate-400 hover:text-ora-blue hover:bg-ora-blue/8 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="inline-flex items-center gap-1.5 text-sm text-ora-blue hover:text-ora-dark font-medium transition-colors">
                  Voir plus <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  Annuler
                </button>
              </div>
            </Block>

            <Block title="États désactivé et chargement">
              <div className="flex flex-wrap gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <button disabled className="px-6 py-2.5 bg-ora-blue text-white rounded-full font-semibold text-sm opacity-40 cursor-not-allowed">
                  Désactivé
                </button>
                <button disabled className="px-6 py-2.5 bg-ora-blue text-white rounded-full font-semibold text-sm opacity-60 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                </button>
                <button className="px-6 py-2.5 bg-red-600 text-white rounded-full font-semibold text-sm hover:bg-red-700 transition-colors">
                  Danger
                </button>
              </div>
            </Block>
          </Section>

          {/* ─────────── BADGES ─────────── */}
          <Section id="badges" title="Badges & Pills" sub="Indicateurs d'état, étiquettes et métadonnées">

            <Block title="Statuts mentorat">
              <div className="flex flex-wrap gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                {[
                  { label: 'ACTIF',      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200'  },
                  { label: 'EN ATTENTE', cls: 'bg-amber-100 text-amber-700 border-amber-200'        },
                  { label: 'CLÔTURÉ',   cls: 'bg-slate-100 text-slate-600 border-slate-200'        },
                  { label: 'ARRÊTÉ',    cls: 'bg-red-100 text-red-600 border-red-200'              },
                  { label: 'NOUVEAU',   cls: 'bg-sky-100 text-sky-700 border-sky-200'              },
                ].map(b => (
                  <span key={b.label} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${b.cls}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            </Block>

            <Block title="Urgences">
              <div className="flex flex-wrap gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                {[
                  { level: 5, label: 'Très urgent', cls: 'text-red-700 bg-red-100 border-red-200'          },
                  { level: 4, label: 'Urgent',      cls: 'text-orange-700 bg-orange-100 border-orange-200' },
                  { level: 3, label: 'Modéré',      cls: 'text-amber-700 bg-amber-100 border-amber-200'    },
                  { level: 2, label: 'Faible',      cls: 'text-slate-600 bg-slate-100 border-slate-200'    },
                  { level: 1, label: 'Très faible', cls: 'text-slate-500 bg-slate-50 border-slate-200'     },
                ].map(u => (
                  <span key={u.level} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${u.cls}`}>
                    <Flame className="w-2.5 h-2.5" />{u.level} — {u.label}
                  </span>
                ))}
              </div>
            </Block>

            <Block title="Tags & rôles">
              <div className="flex flex-wrap gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ora-blue/10 text-ora-blue border border-ora-blue/20">Apprenti(e)</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Mentor</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">ACP</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">AP</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">Animateur</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">CN</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                  <GraduationCap className="w-2.5 h-2.5" />Formé
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-ora-blue/10 text-ora-blue border border-ora-blue/20">
                  <BadgeCheck className="w-2.5 h-2.5" />Validé
                </span>
              </div>
            </Block>

            <Block title="Notation étoiles">
              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                    ))}
                  </div>
                ))}
              </div>
            </Block>
          </Section>

          {/* ─────────── CARTES ─────────── */}
          <Section id="cartes" title="Cartes" sub="Conteneurs de contenu — 3 niveaux d'élévation">

            <Block title="Carte standard">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-ora-blue/20 transition-all">
                  <div className="w-10 h-10 bg-ora-blue/10 rounded-xl flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-ora-blue" />
                  </div>
                  <p className="font-bold text-slate-900 mb-1">Carte standard</p>
                  <p className="text-sm text-slate-500">Border slate-100 · shadow-sm · hover shadow-md + border bleue</p>
                </div>
                <div className="rounded-2xl border-t-4 border-ora-orange bg-gradient-to-br from-ora-orange/5 to-white shadow p-5">
                  <div className="w-10 h-10 bg-ora-orange/10 rounded-xl flex items-center justify-center mb-3">
                    <Heart className="w-5 h-5 text-ora-orange" />
                  </div>
                  <p className="font-bold text-slate-900 mb-1">Carte accent orange</p>
                  <p className="text-sm text-slate-500">Border-top 4px · gradient from-orange/5 · pour CTAs</p>
                </div>
              </div>
            </Block>

            <Block title="Carte statistique">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Mentorats actifs', value: '248', icon: <Users className="w-4 h-4" />, color: 'text-ora-blue bg-ora-blue/10' },
                  { label: 'Pôles',            value: '23',  icon: <MapPin className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-100' },
                  { label: 'Mentors',          value: '312', icon: <HandHeart className="w-4 h-4" />, color: 'text-violet-600 bg-violet-100' },
                  { label: 'Réussite',         value: '91%', icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-600 bg-amber-100' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-slate-100 shadow-sm p-4 bg-white">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>{s.icon}</div>
                    <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </Block>

            <Block title="Carte témoignage / citation">
              <div className="rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-ora-blue hover:shadow-md transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-ora-blue/10 rounded-full flex items-center justify-center shrink-0">
                    <Quote className="w-6 h-6 text-ora-blue" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900">Léa</p>
                      <span className="text-sm text-slate-400">· 19 ans</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-ora-blue/10 text-ora-blue">Apprenti(e)</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "Grâce à mon mentor ORA, j'ai repris confiance en moi et pu aller jusqu'au bout de mon CAP pâtisserie !"
                </p>
              </div>
            </Block>
          </Section>

          {/* ─────────── FORMULAIRES ─────────── */}
          <Section id="formulaires" title="Formulaires" sub="Inputs, selects, textareas — cohérence sur tous les formulaires">

            <Block title="Champs de saisie">
              <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Champ texte standard</label>
                  <input type="text" placeholder="Ex : Marie Dupont" className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Avec hint</label>
                  <input type="email" placeholder="marie@exemple.fr" className={INPUT_CLS} />
                  <p className="text-[11px] text-slate-400 mt-1">Format attendu : adresse email valide</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select</label>
                  <select className={INPUT_CLS}>
                    <option value="">Sélectionner…</option>
                    <option>Option 1</option>
                    <option>Option 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Textarea</label>
                  <textarea rows={3} placeholder="Décrivez votre demande…" className={INPUT_CLS + ' resize-none'} />
                </div>
              </div>
            </Block>

            <Block title="Radio cards (choix exclusif)">
              <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
                {[
                  { value: 'apprentissage', label: 'Déjà en apprentissage', checked: true  },
                  { value: 'recherche',     label: "En recherche d'apprentissage", checked: false },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    opt.checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}>
                    <input type="radio" defaultChecked={opt.checked} name="demo" className="w-4 h-4 accent-blue-600" />
                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </Block>

            <Block title="Checkbox d'engagement">
              <div className="max-w-lg p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    J'accepte les conditions générales d'utilisation et la politique de confidentialité.*
                  </span>
                </label>
              </div>
            </Block>
          </Section>

          {/* ─────────── ICÔNES ─────────── */}
          <Section id="icones" title="Icônes" sub="Lucide React — tailles et usages normalisés">

            <Block title="Bibliothèque et tailles">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-600 mb-6">Toutes les icônes viennent de <span className="font-semibold text-slate-800">lucide-react</span>. Usage avec <code className="text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">strokeWidth</code> par défaut (2).</p>
                <div className="flex items-end gap-8 flex-wrap">
                  {[
                    { size: 'w-2.5 h-2.5', label: '10px', desc: 'Ultra-compact' },
                    { size: 'w-3 h-3',     label: '12px', desc: 'Badges' },
                    { size: 'w-4 h-4',     label: '16px', desc: 'Standard ✓' },
                    { size: 'w-5 h-5',     label: '20px', desc: 'Entrées' },
                    { size: 'w-6 h-6',     label: '24px', desc: 'Illustrations' },
                    { size: 'w-8 h-8',     label: '32px', desc: 'Sections' },
                    { size: 'w-12 h-12',   label: '48px', desc: 'Hero / vide' },
                  ].map(s => (
                    <div key={s.size} className="flex flex-col items-center gap-2">
                      <ShieldCheck className={`${s.size} text-ora-blue`} />
                      <p className="text-[10px] font-mono text-slate-500">{s.label}</p>
                      <p className="text-[10px] text-slate-400">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Block>

            <Block title="Icônes clés du projet">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                {[
                  { icon: <Users />,        label: 'Users'       },
                  { icon: <HandHeart />,    label: 'HandHeart'   },
                  { icon: <GraduationCap />,label: 'Graduation'  },
                  { icon: <MapPin />,       label: 'MapPin'      },
                  { icon: <Mail />,         label: 'Mail'        },
                  { icon: <ShieldCheck />,  label: 'Shield'      },
                  { icon: <CheckCircle />,  label: 'Check'       },
                  { icon: <AlertCircle />,  label: 'Alert'       },
                  { icon: <TrendingUp />,   label: 'Trending'    },
                  { icon: <Flame />,        label: 'Flame'       },
                  { icon: <Lock />,         label: 'Lock'        },
                  { icon: <Quote />,        label: 'Quote'       },
                  { icon: <Star />,         label: 'Star'        },
                  { icon: <Heart />,        label: 'Heart'       },
                  { icon: <Info />,         label: 'Info'        },
                  { icon: <Plus />,         label: 'Plus'        },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-ora-blue hover:border-ora-blue/30 transition-colors">
                      {icon}
                    </div>
                    <p className="text-[9px] text-slate-400 text-center">{label}</p>
                  </div>
                ))}
              </div>
            </Block>
          </Section>

          {/* ─────────── ALERTES ─────────── */}
          <Section id="alertes" title="Alertes & Notifications" sub="Retours visuels — succès, erreur, attention, info">
            <Block>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800 font-medium">Succès — Action réalisée avec succès.</p>
                </div>
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">Erreur — Une erreur est survenue. Veuillez réessayer.</p>
                </div>
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">Attention — Vérifiez les informations avant de continuer.</p>
                </div>
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 font-medium">Information — Complément d'information utile à l'utilisateur.</p>
                </div>
              </div>
            </Block>
          </Section>

          {/* ─────────── LAYOUT ─────────── */}
          <Section id="layout" title="Layout & Espacement" sub="Grilles, containers et règles d'espacement">

            <Block title="Containers">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pr-4">Classe</th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pr-4">Largeur max</th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TokenRow token="max-w-3xl"  value="48rem / 768px"   desc="Formulaires, pages de contenu étroites" />
                    <TokenRow token="max-w-4xl"  value="56rem / 896px"   desc="Articles, pages Témoignages/FAQ" />
                    <TokenRow token="max-w-5xl"  value="64rem / 1024px"  desc="Héros de pages, Contact, Implantations" />
                    <TokenRow token="max-w-6xl"  value="72rem / 1152px"  desc="Dashboards, grilles de cartes" />
                    <TokenRow token="max-w-7xl"  value="80rem / 1280px"  desc="Header / Footer (full width)" />
                  </tbody>
                </table>
              </div>
            </Block>

            <Block title="Espacement vertical (sections)">
              <div className="space-y-2">
                {[
                  { cls: 'py-8',  px: '32px', usage: 'Section compacte (carte hero, territoire)' },
                  { cls: 'py-12', px: '48px', usage: 'Section standard dashboard'               },
                  { cls: 'py-14', px: '56px', usage: 'Formulaires, corps de contenu'            },
                  { cls: 'py-16', px: '64px', usage: 'Sections héros et statistiques'           },
                  { cls: 'py-20', px: '80px', usage: 'Grands héros de pages'                    },
                ].map(s => (
                  <div key={s.cls} className="flex items-center gap-4 py-2 border-b border-slate-100">
                    <code className="text-xs font-mono text-violet-600 w-20 shrink-0">{s.cls}</code>
                    <span className="text-xs text-slate-500 w-12 shrink-0">{s.px}</span>
                    <span className="text-xs text-slate-400">{s.usage}</span>
                  </div>
                ))}
              </div>
            </Block>

            <Block title="Grilles responsives">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono text-violet-600 mb-2">grid md:grid-cols-2 gap-6</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[1,2].map(i => <div key={i} className="h-12 bg-ora-blue/8 rounded-xl border border-ora-blue/20 flex items-center justify-center text-xs text-ora-blue font-mono">col {i}</div>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono text-violet-600 mb-2">grid md:grid-cols-3 gap-6</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-ora-orange/8 rounded-xl border border-ora-orange/20 flex items-center justify-center text-xs text-ora-orange font-mono">col {i}</div>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono text-violet-600 mb-2">grid grid-cols-2 sm:grid-cols-4 gap-3</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-12 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center text-xs text-emerald-600 font-mono">col {i}</div>)}
                  </div>
                </div>
              </div>
            </Block>

            <Block title="Border radius">
              <div className="flex flex-wrap gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                {[
                  { cls: 'rounded-lg',   label: 'rounded-lg',   desc: '8px — Inputs, boutons compacts' },
                  { cls: 'rounded-xl',   label: 'rounded-xl',   desc: '12px — Cartes, champs'          },
                  { cls: 'rounded-2xl',  label: 'rounded-2xl',  desc: '16px — Cartes larges, modales'  },
                  { cls: 'rounded-3xl',  label: 'rounded-3xl',  desc: '24px — Images héro'             },
                  { cls: 'rounded-full', label: 'rounded-full', desc: '∞ — Boutons CTA, badges'        },
                ].map(r => (
                  <div key={r.cls} className="flex flex-col items-center gap-2">
                    <div className={`w-16 h-16 bg-ora-blue/10 border-2 border-ora-blue/30 ${r.cls}`} />
                    <p className="text-[10px] font-mono text-violet-600">{r.label}</p>
                    <p className="text-[9px] text-slate-400 text-center max-w-[80px]">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Block>
          </Section>

          {/* ─────────── PIED DE PAGE CHARTE ─────────── */}
          <div className="pt-8 pb-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>ORA Design System — v1.0 · 2026</span>
            <span>React + TypeScript + Tailwind CSS · Lucide React</span>
          </div>

        </main>
      </div>
    </div>
  );
}
