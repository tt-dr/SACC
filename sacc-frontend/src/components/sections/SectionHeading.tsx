import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, description, actions, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-7", className)}>
      {actions ? (
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.01em] sm:text-3xl">{title}</h2>
            {description && <p className="mt-2 text-[#5a6780]">{description}</p>}
          </div>
          {actions}
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold tracking-[-0.01em] sm:text-3xl">{title}</h2>
          {description && <p className="mt-2 text-[#5a6780]">{description}</p>}
        </>
      )}
    </div>
  );
}
