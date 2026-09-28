interface LockedStateProps {
  title: string;
  description: string;
  redirectLabel?: string;
}

// The "explained permission boundary" pattern from prototype/officer-admin.html
// (Auditor's Scan tab). Use this instead of silently hiding a nav item
// whenever a role hits a scope boundary — see claude.md "Roles & permissions".
export default function LockedState({ title, description, redirectLabel }: LockedStateProps) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-sm mt-2">
      <div className="w-14 h-14 rounded-full bg-mist flex items-center justify-center mx-auto mb-4">
        {/* Lock icon — matches prototype/officer-admin.html .locked-icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 stroke-gray-400"
        >
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h4 className="font-heading font-bold text-forest mb-1.5 text-sm">{title}</h4>
      <p className="text-[12px] text-gray-500 max-w-xs mx-auto leading-relaxed">{description}</p>
      {redirectLabel && (
        <span className="inline-block mt-3 text-[10.5px] font-bold text-primary bg-mist px-3 py-1.5 rounded-full">
          {redirectLabel}
        </span>
      )}
    </div>
  );
}
