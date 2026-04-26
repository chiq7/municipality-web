export default function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: string;
}) {
  const display = value?.trim() || null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {icon && <span className="text-lg mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        {display ? (
          <p className="text-sm text-gray-900 font-medium break-words">{display}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">未取得</p>
        )}
      </div>
    </div>
  );
}
