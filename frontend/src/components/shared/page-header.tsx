import { ChevronRight } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b bg-background px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <div>
        <div className="mb-2 flex items-center text-xs text-muted-foreground">
          ERP Avicole <ChevronRight className="mx-1 h-3 w-3" /> {title}
        </div>
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
