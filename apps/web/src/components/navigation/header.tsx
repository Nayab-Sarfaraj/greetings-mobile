"use client";

import Link from "next/link";
import { AppAuthControls } from "@/components/auth/app-auth";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
            CherryQube
          </span>
        </Link>

        <nav className="flex items-center gap-5 sm:gap-7">
          <Link
            href="/"
            className="text-sm font-medium text-ink/80 hover:text-accent transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-ink/80 hover:text-accent transition-colors"
          >
            Dashboard
          </Link>
          <AppAuthControls />
        </nav>
      </div>
    </header>
  );
}
