export function StatCard({
    title,
    value,
    highlight,
  }: {
    title: string;
    value: string | number;
    highlight?: boolean;
  }) {
    return (
      <div
        className={`rounded-xl p-5 shadow bg-white ${
          highlight ? 'border-l-4 border-ora-blue' : ''
        }`}
      >
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    );
  }
  