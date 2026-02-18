"use client";

import { useState } from "react";
import { TextGenerationOutput } from "@/types";

interface Props {
  results: TextGenerationOutput[];
  onApprove: (result: TextGenerationOutput) => void;
}

export function RussianTextOutput({ results, onApprove }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editedResults, setEditedResults] = useState(results);

  function updateField(
    index: number,
    key: keyof TextGenerationOutput,
    value: string
  ) {
    setEditedResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    );
  }

  const fields: { key: keyof TextGenerationOutput; label: string }[] = [
    { key: "hook_ru", label: "Hook" },
    { key: "offer_ru", label: "Offer" },
    { key: "cta_ru", label: "CTA" },
    { key: "full_copy_ru", label: "Full Copy" },
  ];

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="h-5 w-1 rounded-full"
            style={{ background: "var(--coral-400)" }}
          />
          <h3 className="text-lg font-bold" style={{ color: "var(--gray-800)" }}>
            النسخ المولّدة
          </h3>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-700"
          style={{
            background: "var(--coral-50)",
            color: "var(--coral-500)",
          }}
        >
          {editedResults.length} نسخ
        </span>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-scroll" style={{ scrollbarWidth: "thin" }}>
        {editedResults.map((result, index) => {
          const isSelected = selectedIndex === index;
          return (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              className="flex w-80 min-w-[20rem] shrink-0 cursor-pointer flex-col rounded-2xl p-5 transition-all duration-300 animate-fade-in-up"
              style={{
                animationDelay: `${index * 0.07}s`,
                opacity: 0,
                background: isSelected ? "var(--coral-50)" : "var(--bg-surface)",
                border: isSelected
                  ? "2px solid var(--coral-400)"
                  : "2px solid var(--gray-200)",
                boxShadow: isSelected ? "var(--shadow-coral)" : "var(--shadow-sm)",
              }}
            >
              {/* Card header */}
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: isSelected ? "var(--coral-400)" : "var(--gray-100)",
                    color: isSelected ? "#FFF" : "var(--gray-500)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {index + 1}
                </span>
                {isSelected && (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full animate-scale-in"
                    style={{ background: "var(--coral-400)" }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="#FFF" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="flex flex-1 flex-col gap-3.5">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label
                      className="mb-1 block text-[10px] font-bold tracking-[0.12em] uppercase"
                      style={{
                        color: isSelected ? "var(--coral-500)" : "var(--gray-400)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {field.label}
                    </label>
                    {isSelected ? (
                      <textarea
                        value={result[field.key]}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateField(index, field.key, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        rows={field.key === "full_copy_ru" ? 4 : 2}
                        dir="ltr"
                        className="input-luxury w-full px-3 py-2 text-sm leading-relaxed"
                      />
                    ) : (
                      <p dir="ltr" className="text-sm leading-relaxed" style={{ color: "var(--gray-700)" }}>
                        {result[field.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Approve button */}
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => {
            if (selectedIndex !== null) {
              onApprove(editedResults[selectedIndex]);
            }
          }}
          disabled={selectedIndex === null}
          className="w-full rounded-xl py-3.5 text-sm font-700 transition-all duration-300"
          style={{
            background:
              selectedIndex !== null
                ? "var(--teal-400)"
                : "var(--gray-100)",
            color:
              selectedIndex !== null ? "#FFF" : "var(--gray-400)",
            cursor: selectedIndex !== null ? "pointer" : "not-allowed",
            boxShadow: selectedIndex !== null ? "var(--shadow-teal)" : "none",
          }}
        >
          <span className="flex items-center justify-center gap-2">
            {selectedIndex !== null ? (
              <>
                اعتمد النسخة #{selectedIndex + 1} وانتقل لتوليد الصور
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            ) : (
              "اختر نسخة أولاً"
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
