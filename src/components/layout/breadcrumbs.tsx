import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
        <Home size={14} />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={idx} className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-muted-foreground/60" />
            {isLast || !item.href ? (
              <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-xs">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
