"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { href: "/generate", label: "توليد النص", step: 1 },
  { href: "/images", label: "توليد الصور", step: 2 },
  { href: "/gallery", label: "المعرض", step: 3 },
];

export function Navbar() {
  const pathname = usePathname();
  const currentStepIndex = steps.findIndex((s) => s.href === pathname);

  return (
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

        {/* Stepper navigation */}
        <div className="flex items-center gap-0">
          {steps.map((step, i) => {
            const isActive = pathname === step.href;
            const isPast = currentStepIndex > i;

            return (
              <div key={step.href} className="flex items-center">
                {/* Connector line */}
                {i > 0 && (
                  <div
                    className="mx-1 hidden h-[2px] w-8 rounded-full transition-colors duration-300 sm:block"
                    style={{
                      background: isPast ? "var(--coral-400)" : "var(--gray-200)",
                    }}
                  />
                )}

                <Link
                  href={step.href}
                  className="group flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-250 sm:px-4 sm:py-2"
                  style={{
                    background: isActive ? "var(--coral-50)" : "transparent",
                  }}
                >
                  {/* Step circle */}
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-250"
                    style={{
                      background: isActive
                        ? "var(--coral-400)"
                        : isPast
                          ? "var(--coral-400)"
                          : "var(--gray-200)",
                      color: isActive || isPast ? "#FFFFFF" : "var(--gray-500)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {isPast ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.step
                    )}
                  </span>

                  {/* Label — hidden on mobile for non-active */}
                  <span
                    className="text-sm font-500 transition-colors duration-250"
                    style={{
                      color: isActive
                        ? "var(--coral-500)"
                        : isPast
                          ? "var(--gray-700)"
                          : "var(--gray-400)",
                      fontWeight: isActive ? 700 : 500,
                      display: isActive ? "inline" : undefined,
                    }}
                  >
                    <span className={isActive ? "" : "hidden sm:inline"}>{step.label}</span>
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom border */}
      <div style={{ height: "1px", background: "var(--gray-200)" }} />
    </nav>
  );
}
