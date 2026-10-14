import { type ReactNode } from "react";

interface Props {
  title: string;
  sub?: string;
  action?: ReactNode;
}

export default function EmptyState({ title, sub, action }: Props) {
  return (
    <div className="text-center py-20 px-5">
      <p className="text-[15px] font-semibold text-charcoal">{title}</p>
      {sub && (
        <p className="text-[13.5px] text-muted mt-2 max-w-[26em] mx-auto">
          {sub}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}