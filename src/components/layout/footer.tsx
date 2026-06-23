import Link from "next/link";
import { Cpu } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/20 py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-sm">
            {APP_NAME} <span className="text-muted-foreground font-normal">© {new Date().getFullYear()}</span>
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link href="/components" className="hover:text-cyan-400 transition-colors">
            All Components
          </Link>
          <Link href="/categories" className="hover:text-cyan-400 transition-colors">
            Categories
          </Link>
          <Link href="/footprints" className="hover:text-cyan-400 transition-colors">
            Footprints
          </Link>
          <Link href="/about" className="hover:text-cyan-400 transition-colors">
            About
          </Link>
          <Link href="/admin" className="hover:text-cyan-400 transition-colors">
            Admin Console
          </Link>
        </div>
      </div>
    </footer>
  );
}
