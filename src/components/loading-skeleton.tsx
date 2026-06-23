export function CardSkeleton() {
  return (
    <div className="w-full flex flex-col rounded-xl overflow-hidden glass border border-border/40 animate-pulse">
      {/* Schematic preview skeleton */}
      <div className="h-40 w-full bg-muted/20 border-b border-border/20 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted/30" />
      </div>

      <div className="p-5 space-y-4">
        <div>
          {/* Header row skeleton */}
          <div className="flex justify-between items-center mb-2">
            <div className="h-3 w-16 bg-muted/40 rounded" />
            <div className="h-4 w-12 bg-muted/40 rounded-full" />
          </div>
          <div className="h-5 w-24 bg-muted/60 rounded mb-3" />
          <div className="h-3 w-full bg-muted/30 rounded" />
          <div className="h-3 w-5/6 bg-muted/30 rounded mt-1.5" />
        </div>

        <div className="space-y-3 pt-3 border-t border-border/20">
          <div className="flex gap-2">
            <div className="h-3 w-10 bg-muted/40 rounded" />
            <div className="h-3 w-12 bg-muted/40 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-16 bg-muted/45 rounded" />
            <div className="h-3.5 w-16 bg-muted/45 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-border/20 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-muted/30 rounded w-2/3" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border/40 glass">
      <table className="w-full border-collapse">
        <thead className="bg-muted/15 border-b border-border/40">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <div className="h-4 bg-muted/50 rounded w-1/3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-6 w-48 bg-muted/30 rounded mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 h-64 bg-muted/20 rounded-xl glass border border-border/40" />
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-muted/40 rounded w-1/3" />
            <div className="h-4 bg-muted/30 rounded w-1/4" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted/30 rounded w-full" />
            <div className="h-4 bg-muted/30 rounded w-full" />
            <div className="h-4 bg-muted/30 rounded w-2/3" />
          </div>
          <div className="h-10 bg-muted/40 rounded w-48" />
        </div>
      </div>
      <div className="h-px bg-border/20 my-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64 bg-muted/25 rounded-xl border border-border/40 glass" />
        <div className="h-64 bg-muted/25 rounded-xl border border-border/40 glass" />
      </div>
    </div>
  );
}
