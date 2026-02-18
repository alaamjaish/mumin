"use client";

import { AD_STYLES } from "@/lib/styles";

interface Props {
  selectedStyles: string[];
  onToggle: (styleId: string) => void;
}

const styleEmojis: Record<string, string> = {
  cartoon: "🎨",
  realistic: "📸",
  flat: "◻️",
  "3d": "💎",
  watercolor: "🖌️",
  minimalist: "✨",
  "pop-art": "💥",
  vintage: "📜",
  neon: "⚡",
  isometric: "🔷",
};

export function StyleSelector({ selectedStyles, onToggle }: Props) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <label className="text-sm font-700" style={{ color: "var(--gray-800)" }}>
          اختر الستايلات المطلوبة
        </label>
        {selectedStyles.length > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-700"
            style={{ background: "var(--coral-50)", color: "var(--coral-500)" }}
          >
            {selectedStyles.length} محدد
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {AD_STYLES.map((style, i) => {
          const isSelected = selectedStyles.includes(style.id);
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onToggle(style.id)}
              className="group relative overflow-hidden rounded-xl px-3 py-3.5 text-center transition-all duration-250 animate-fade-in-up"
              style={{
                animationDelay: `${i * 0.03}s`,
                opacity: 0,
                background: isSelected ? "var(--coral-50)" : "var(--bg-surface)",
                border: isSelected
                  ? "2px solid var(--coral-400)"
                  : "2px solid var(--gray-200)",
                boxShadow: isSelected ? "var(--shadow-coral)" : "var(--shadow-xs)",
              }}
            >
              {/* Selection checkmark */}
              {isSelected && (
                <div
                  className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full animate-scale-in"
                  style={{ background: "var(--coral-400)" }}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#FFF" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="mb-1 text-xl">
                {styleEmojis[style.id] || "🎭"}
              </div>
              <div
                className="text-[13px] font-600 transition-colors"
                style={{
                  color: isSelected ? "var(--coral-500)" : "var(--gray-700)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {style.name}
              </div>
              <div
                className="mt-0.5 text-[11px]"
                style={{ color: isSelected ? "var(--coral-400)" : "var(--gray-400)" }}
              >
                {style.name_ar}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
