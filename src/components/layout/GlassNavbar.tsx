"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShieldCheck, Plus, ChevronDown, UserCheck } from "lucide-react";
import { UserRole, UserSession } from "@/lib/types";

export const GlassNavbar: React.FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const switchRole = async (newRole: UserRole) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setRoleMenuOpen(false);
        window.location.reload();
      }
    } catch {}
  };

  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scan & Verify", href: "/verify" },
    { label: "Status", href: "/status" },
    { label: "Docs", href: "/docs" },
    { label: "Privacy", href: "/privacy" },
  ];

  if (currentUser?.role === "OPERATOR" || currentUser?.role === "AUDITOR") {
    navLinks.push({ label: "Operator", href: "/operator" });
  }

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 pt-4 pb-2 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className={cn(
          "pointer-events-auto w-full rounded-pill border border-white/60 bg-surface/85 backdrop-blur-glass shadow-glass px-6 sm:px-8 py-2.5 transition-all",
          "flex items-center justify-between"
        )}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight text-ink-primary">
            Bio<span className="text-primary font-normal">Seal</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-small text-ink-secondary">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-ink-primary",
                  isActive ? "text-primary font-medium" : "text-ink-secondary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Action & Persona Switcher */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-pill border border-border bg-surface text-small text-ink-secondary hover:text-ink-primary hover:border-border-strong transition-colors"
              title="Active Persona"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  currentUser?.role === "OPERATOR"
                    ? "bg-[#B45309]"
                    : currentUser?.role === "AUDITOR"
                    ? "bg-[#334155]"
                    : "bg-[#15803D]"
                )}
              />
              <span className="font-mono text-xs">{currentUser?.role || "USER"}</span>
              <ChevronDown className="h-3 w-3 text-ink-muted" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-card border border-border bg-surface p-1.5 z-50 text-small">
                <span className="block px-3 py-1.5 text-label uppercase text-ink-muted border-b border-border mb-1">
                  Persona Switcher
                </span>
                <button
                  onClick={() => switchRole("USER")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-surface-soft",
                    currentUser?.role === "USER" && "text-primary font-medium"
                  )}
                >
                  <div>
                    <div>Novartis Shipper</div>
                    <div className="text-[11px] text-ink-muted font-mono">Role: USER</div>
                  </div>
                  {currentUser?.role === "USER" && <UserCheck className="h-3.5 w-3.5 text-primary" />}
                </button>
                <button
                  onClick={() => switchRole("OPERATOR")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-surface-soft",
                    currentUser?.role === "OPERATOR" && "text-primary font-medium"
                  )}
                >
                  <div>
                    <div>BioSeal Operator</div>
                    <div className="text-[11px] text-ink-muted font-mono">Role: OPERATOR</div>
                  </div>
                  {currentUser?.role === "OPERATOR" && <UserCheck className="h-3.5 w-3.5 text-primary" />}
                </button>
                <button
                  onClick={() => switchRole("AUDITOR")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-surface-soft",
                    currentUser?.role === "AUDITOR" && "text-primary font-medium"
                  )}
                >
                  <div>
                    <div>Veritas Auditor</div>
                    <div className="text-[11px] text-ink-muted font-mono">Role: AUDITOR</div>
                  </div>
                  {currentUser?.role === "AUDITOR" && <UserCheck className="h-3.5 w-3.5 text-primary" />}
                </button>
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <Link
            href="/create"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-pill bg-primary px-4 py-1.5 text-small font-medium text-white hover:bg-primary-hover active:scale-[0.99] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create an escrow</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-1.5 text-ink-secondary hover:bg-surface-soft"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden w-full mt-2 rounded-card border border-white/60 bg-surface/95 backdrop-blur-glass shadow-glass p-4 text-small font-medium space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 rounded-lg text-ink-secondary hover:bg-surface-soft"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border">
            <Link
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-pill bg-primary w-full py-2 text-small font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Create an escrow</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
