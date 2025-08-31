import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-9 text-primary"
      >
        <path
          d="M32.053 14.129C33.0485 14.4716 33.75 15.422 33.75 16.5165V17.25C33.75 24.2888 28.0388 30 21 30H15C7.8203 30 2.25 24.1797 2.25 17C2.25 9.8203 7.8203 4.25 15 4.25H16.5"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M13.5 19.5L18 24L28.5 13.5"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-sm font-bold leading-none tracking-tighter text-foreground">
          SERVIÇOS
        </span>
        <span className="text-2xl font-bold leading-none text-primary">
          JÁ
        </span>
      </div>
    </div>
  );
}
