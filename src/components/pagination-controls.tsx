"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 mt-8 font-mono text-sm">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-border/40 hover:bg-muted/40 text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="First Page"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-border/40 hover:bg-muted/40 text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Previous Page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            "w-9 h-9 rounded-md border text-center font-medium transition-colors",
            currentPage === p
              ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-bold"
              : "border-border/40 hover:bg-muted/40 text-muted-foreground"
          )}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-border/40 hover:bg-muted/40 text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Next Page"
      >
        <ChevronRight size={16} />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-border/40 hover:bg-muted/40 text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Last Page"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
}
