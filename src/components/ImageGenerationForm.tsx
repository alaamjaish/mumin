"use client";

import { useState } from "react";
import { StyleSelector } from "./StyleSelector";
import { useAppContext } from "./AppProvider";
import { generateImagesForStyles } from "@/lib/client-image-gen";
import { AD_STYLES } from "@/lib/styles";

const MAX_TOTAL_IMAGES_PER_REQUEST = 30;

interface Props {
  russianText: string;
  adId: string;
  imageInstructions: string;
  overrideGlobal: boolean;
  globalImageInstructions: string;
  onImageInstructionsChange: (instructions: string) => void;
  onOverrideChange: (override: boolean) => void;
  onImagesGenerated: (images: { style: string; url: string }[]) => void;
}

export function ImageGenerationForm({
  russianText,
  adId,
  imageInstructions,
  overrideGlobal,
  globalImageInstructions,
  onImageInstructionsChange,
  onOverrideChange,
  onImagesGenerated,
}: Props) {
  const { geminiApiKey } = useAppContext();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [countPerStyle, setCountPerStyle] = useState(2);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  // keep adId in scope
  void adId;

  // Resolve instructions
  const resolvedInstructions = overrideGlobal
    ? imageInstructions
    : [globalImageInstructions, imageInstructions].filter(Boolean).join("\n\n");

  function toggleStyle(styleId: string) {
    setSelectedStyles((prev) =>
      prev.includes(styleId) ? prev.filter((s) => s !== styleId) : [...prev, styleId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!geminiApiKey) {
      setError("أدخل مفتاح Gemini API في الإعدادات أولاً ⚙️");
      return;
    }

    if (selectedStyles.length === 0) {
      setError("Pick at least one style.");
      return;
    }

    const normalizedCount = Math.min(Math.max(Math.floor(countPerStyle) || 1, 1), 10);
    if (normalizedCount !== countPerStyle) {
      setCountPerStyle(normalizedCount);
    }

    const totalRequested = selectedStyles.length * normalizedCount;
    if (totalRequested > MAX_TOTAL_IMAGES_PER_REQUEST) {
      setError(`Too many images in one request (${totalRequested}). Max is ${MAX_TOTAL_IMAGES_PER_REQUEST}.`);
      return;
    }

    setLoading(true);
    setError("");
    setProgress(`Generating ${totalRequested} images across ${selectedStyles.length} styles...`);

    try {
      const { images, styleErrors } = await generateImagesForStyles(
        geminiApiKey,
        russianText,
        selectedStyles,
        normalizedCount,
        resolvedInstructions,
      );

      if (images.length === 0) {
        const errorMsgs = styleErrors.map((e) => {
          const s = AD_STYLES.find((st) => st.id === e.style);
          return `${s?.name || e.style}: ${e.message}`;
        });
        throw new Error(`Failed to generate any images.\n${errorMsgs.join("\n")}`);
      }

      onImagesGenerated(images);

      if (styleErrors.length > 0) {
        const partialErrors = styleErrors.map((e) => {
          const s = AD_STYLES.find((st) => st.id === e.style);
          return `${s?.name || e.style}: ${e.message}`;
        });
        setError(`Some styles failed:\n${partialErrors.join("\n")}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div
        className="rounded-xl p-4 animate-fade-in"
        style={{
          background: "var(--bg-inset)",
          border: "1px solid var(--gray-200)",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--teal-400)" }} />
          <p
            className="text-[10px] font-bold tracking-[0.12em] uppercase"
            style={{
              color: "var(--teal-500)",
              fontFamily: "var(--font-body)",
            }}
          >
            Approved Russian Copy
          </p>
        </div>
        <p dir="ltr" className="text-sm leading-relaxed" style={{ color: "var(--gray-700)" }}>
          {russianText}
        </p>
      </div>

      <StyleSelector selectedStyles={selectedStyles} onToggle={toggleStyle} />

      <div className="animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
        <label className="mb-2 block text-sm font-700" style={{ color: "var(--gray-800)" }}>
          Images per style
        </label>
        <input
          type="number"
          min={1}
          max={10}
          value={countPerStyle}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            if (!Number.isFinite(parsed)) {
              setCountPerStyle(1);
              return;
            }
            setCountPerStyle(Math.min(Math.max(Math.floor(parsed), 1), 10));
          }}
          className="input-luxury w-28 px-4 py-2.5 text-center text-sm"
        />
      </div>

      {/* Per-ad image instructions */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-700" style={{ color: "var(--gray-800)" }}>
            تعليمات صور هذا الإعلان
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs" style={{ color: "var(--gray-500)" }}>
              تجاوز التعليمات العامة
            </span>
            <div
              className="relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer"
              style={{ background: overrideGlobal ? "var(--coral-400)" : "var(--gray-200)" }}
              onClick={() => onOverrideChange(!overrideGlobal)}
            >
              <div
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-200"
                style={{ left: overrideGlobal ? "18px" : "2px" }}
              />
            </div>
          </label>
        </div>
        <textarea
          value={imageInstructions}
          onChange={(e) => onImageInstructionsChange(e.target.value)}
          placeholder="Example: add Arabic books stickers, dark blue background, studying person..."
          rows={4}
          dir="ltr"
          className="input-luxury w-full px-4 py-3 text-sm leading-relaxed"
        />
        {!overrideGlobal && globalImageInstructions && (
          <p className="mt-1.5 text-xs" style={{ color: "var(--gray-400)" }}>
            سيتم دمج هذه التعليمات مع التعليمات العامة
          </p>
        )}
        {overrideGlobal && (
          <p className="mt-1.5 text-xs" style={{ color: "var(--coral-400)" }}>
            التعليمات العامة مُتجاوَزة — تعليمات هذا الإعلان فقط ستُستخدم
          </p>
        )}
      </div>

      {/* Missing API key warning */}
      {!geminiApiKey && (
        <div
          className="animate-scale-in rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(217,155,51,0.08)",
            border: "1px solid rgba(217,155,51,0.2)",
            color: "var(--gray-700)",
          }}
        >
          ⚠️ لم يتم إدخال مفتاح Gemini API — افتح الإعدادات ⚙️ وأدخل المفتاح أولاً
        </div>
      )}

      {error && (
        <div
          className="animate-scale-in rounded-lg px-4 py-3 text-sm whitespace-pre-wrap"
          style={{
            background: "rgba(217,79,51,0.06)",
            border: "1px solid rgba(217,79,51,0.12)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || selectedStyles.length === 0 || !geminiApiKey}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z"
                />
              </svg>
              Generate Images ({selectedStyles.length} styles x {countPerStyle} = {selectedStyles.length * countPerStyle})
            </>
          )}
        </span>
      </button>
    </form>
  );
}
