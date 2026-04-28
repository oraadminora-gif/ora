// src/components/StatSection.tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
  icon: ReactNode;
  description: string;
  color: string;
}

interface StatSectionProps {
  stats: StatItem[];
}

// Easing ease-out cubique pour une animation plus naturelle
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedCounter({ value, suffix, isVisible }: {
  value: number; suffix: string; isVisible: boolean;
}) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 1800;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(easeOutCubic(progress) * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCount(value);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isVisible, value]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString('fr-FR')}{suffix}
    </span>
  );
}

export function StatSection({ stats }: StatSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-8 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}
    >
      {/* Cercles décoratifs en arrière-plan */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="relative flex flex-col items-center text-center px-6 py-4 group">

              {/* Séparateur vertical entre les items (desktop uniquement) */}
              {i < stats.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-8 bottom-8 w-px bg-white/10" />
              )}

              {/* Icône */}
              <div className="mb-4 w-14 h-14 rounded-2xl flex items-center justify-center
                bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300
                shadow-lg">
                {stat.icon}
              </div>

              {/* Compteur animé */}
              <div className={`text-4xl md:text-5xl font-black tracking-tight mb-1 ${stat.color}`}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix ?? ''} isVisible={isVisible} />
              </div>

              {/* Label */}
              <p className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                {stat.label}
              </p>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed max-w-[140px]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Titre section — en bas */}
        <p className="text-center text-xs font-bold uppercase tracking-widest text-blue-400 mt-10">
          ORA en chiffres
        </p>
      </div>
    </section>
  );
}
