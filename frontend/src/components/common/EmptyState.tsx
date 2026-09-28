interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// Standard "nothing here yet" pattern — see prototype files for tone/copy
// examples (e.g. no events this week, no notifications).
export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6">
      <h4 className="font-display font-bold text-forest mb-1">{title}</h4>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">{description}</p>}
      {action}
    </div>
  );
}
