"use client";

import { useState } from "react";
import { StyleSelector } from "./StyleSelector";

interface Props {
  russianText: string;
  onImagesGenerated: (images: { style: string; url: string }[]) => void;
}

export function ImageGenerationForm({
  russianText,
  onImagesGenerated,
}: Props) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [countPerStyle, setCountPerStyle] = useState(2);
  const [visualInstructions, setVisualInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  function toggleStyle(styleId: string) {
    setSelectedStyles((prev) =>
      prev.includes(styleId)
        ? prev.filter((s) => s !== styleId)
        : [...prev, styleId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedStyles.length === 0) {
      setError("اختر ستايل واحد على الأقل");
      return;
    }

    setLoading(true);
    setError("");
    setProgress("جاري توليد الصور...");

    try {
      const res = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          russian_text: russianText,
          styles: selectedStyles,
          count_per_style: countPerStyle,
          visual_instructions: visualInstructions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حدث خطأ في توليد الصور");
      }

      const data = await res.json();
      onImagesGenerated(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Approved Russian text display */}
      <div
        className="rounded-xl p-4 animate-fade-in"
        style={{
          background: "var(--bg-inset)",
          border: "1px solid var(--gray-200)",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--teal-400)" }}
          />
          <p
            className="text-[10px] font-bold tracking-[0.12em] uppercase"
            style={{
              color: "var(--teal-500)",
              fontFamily: "var(--font-body)",
            }}
          >
            النص الروسي المعتمد
          </p>
        </div>
        <p
          dir="ltr"
          className="text-sm leading-relaxed"
          style={{ color: "var(--gray-700)" }}
        >
          {russianText}
        </p>
      </div>

      {/* Style selector */}
      <StyleSelector
        selectedStyles={selectedStyles}
        onToggle={toggleStyle}
      />

      {/* Count per style */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
        <label
          className="mb-2 block text-sm font-700"
          style={{ color: "var(--gray-800)" }}
        >
          عدد الصور لكل ستايل
        </label>
        <input
          type="number"
          min={1}
          max={10}
          value={countPerStyle}
          onChange={(e) => setCountPerStyle(Number(e.target.value))}
          className="input-luxury w-28 px-4 py-2.5 text-center text-sm"
        />
      </div>

      {/* Visual instructions */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
        <label
          className="mb-2 block text-sm font-700"
          style={{ color: "var(--gray-800)" }}
        >
          تعليمات بصرية إضافية
        </label>
        <textarea
          value={visualInstructions}
          onChange={(e) => setVisualInstructions(e.target.value)}
          placeholder="مثال: أضف ستيكرات كتب عربية، خلفية زرقاء غامقة، شخص يدرس، أضف لوغو..."
          rows={4}
          dir="rtl"
          className="input-luxury w-full px-4 py-3 text-sm leading-relaxed"
        />
        <p className="mt-1.5 text-xs" style={{ color: "var(--gray-400)" }}>
          اكتب أي تعليمات إضافية عن شكل الصورة — ستيكرات، ألوان، عناصر، خلفيات...
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-scale-in rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(217,79,51,0.06)",
            border: "1px solid rgba(217,79,51,0.12)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || selectedStyles.length === 0}
        className="btn-gold w-full py-3.5 text-sm"
      >
        <span className="flex items-center justify-center gap-2.5">
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {progress}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
              </svg>
              ولّد الصور ({selectedStyles.length} ستايل × {countPerStyle} صورة ={" "}
              {selectedStyles.length * countPerStyle} صورة)
            </>
          )}
        </span>
      </button>
    </form>
  );
}
