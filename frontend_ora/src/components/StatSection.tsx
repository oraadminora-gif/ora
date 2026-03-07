// Composant séparé dans components/StatSection.tsx
import { useEffect, useRef, useState } from 'react';

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
}

interface StatSectionProps {
  stats: StatItem[];
}

export function StatSection({ stats }: StatSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-2 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <StatCard 
              key={stat.label} 
              stat={stat} 
              isVisible={isVisible} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, isVisible }: { stat: StatItem; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!isVisible) return;
    
    const duration = 2000;
    const increment = stat.value / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.value) {
        setCount(stat.value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [isVisible, stat.value]);

  return (
    <div className="p-4">
      <div className="text-4xl md:text-5xl font-bold text-ora-blue mb-2">
        {count.toLocaleString()}{stat.suffix || ''}
      </div>
      <div className="text-slate-600 font-medium">{stat.label}</div>
    </div>
  );
}