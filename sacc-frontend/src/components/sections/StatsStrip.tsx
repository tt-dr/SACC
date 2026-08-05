interface StatItem {
  value: string;
  label: string;
}

interface StatsStripProps {
  stats: StatItem[];
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <section className="border-y border-[#e7ecf4] bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5 py-4">
              <strong className="text-[28px] font-bold text-[#ff6a00]">{item.value}</strong>
              <span className="text-sm text-[#5a6780]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
