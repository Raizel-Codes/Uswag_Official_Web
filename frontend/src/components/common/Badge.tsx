interface BadgeProps {
  tone?: 'green' | 'amber' | 'red' | 'grey';
  children: React.ReactNode;
}

const TONES: Record<string, string> = {
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  grey: 'bg-gray-100 text-gray-600',
};

export default function Badge({ tone = 'grey', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${TONES[tone]}`}>
      {children}
    </span>
  );
}
