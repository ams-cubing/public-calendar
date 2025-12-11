import { cn } from "@workspace/ui/lib/utils";

// Mapping your Excel colors to Tailwind classes
const statusConfig = {
  // Public Statuses
  announced: "bg-green-500 text-white hover:bg-green-600",
  reserved: "bg-yellow-400 text-black hover:bg-yellow-500",
  confirmed: "bg-orange-500 text-white hover:bg-orange-600", // Venue Ready
  suspended: "bg-red-500 text-white hover:bg-red-600",
  open: "bg-pink-300 text-pink-900 hover:bg-pink-400",
  unavailable: "bg-gray-400 text-white",

  // Internal Statuses (for Dashboard)
  draft: "bg-slate-200 text-slate-700 border border-slate-300",
  looking_for_venue: "bg-blue-100 text-blue-700 border border-blue-200",
  ultimatum_sent: "bg-red-100 text-red-700 border border-red-200 animate-pulse",
};

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
  label?: string; // Optional override
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
        statusConfig[status] || "bg-gray-100 text-gray-800",
        className,
      )}
    >
      {label || status.replace(/_/g, " ")}
    </span>
  );
}
