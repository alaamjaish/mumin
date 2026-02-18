"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SettingsModal } from "./SettingsModal";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/", label: "مولد الإعلانات" },
  { href: "/gallery", label: "المعرض" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/ad/");
    return pathname === href;
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{ background: "rgba(251,249,247,0.85)", backdropFilter: "blur(16px) saturate(180%)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
              style={{ background: "var(--coral-400)" }}
            >
              <span
                className="text-sm font-bold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                M
              </span>
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: "var(--gray-800)", fontFamily: "var(--font-arabic)" }}
            >
              مؤمن
            </span>
          </Link>

          {/* Navigation links + settings + sign out */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-500 transition-all duration-250"
                  style={{
                    background: active ? "var(--coral-50)" : "transparent",
                    color: active ? "var(--coral-500)" : "var(--gray-500)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Settings gear */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="mr-2 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
              style={{ color: "var(--gray-400)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-100)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title="الإعدادات"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
              style={{ color: "var(--gray-400)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(217,79,51,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title="تسجيل الخروج"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom border */}
        <div style={{ height: "1px", background: "var(--gray-200)" }} />
      </nav>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
