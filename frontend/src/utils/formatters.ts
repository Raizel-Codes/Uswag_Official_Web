export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}

export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
