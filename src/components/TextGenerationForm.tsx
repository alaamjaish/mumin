"use client";

import { useState } from "react";
import { TextGenerationInput, TextGenerationOutput } from "@/types";

interface Props {
  instructions: string;
  adId: string;
  initialInput?: TextGenerationInput | null;
  onGenerated: (results: TextGenerationOutput[], input: TextGenerationInput) => void;
}

export function TextGenerationForm({ instructions, adId, initialInput, onGenerated }: Props) {
  const [hook, setHook] = useState(initialInput?.hook ?? "");
  const [offer, setOffer] = useState(initialInput?.offer ?? "");
  const [cta, setCta] = useState(initialInput?.cta ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // keep adId in scope to suppress unused warning
  void adId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hook, offer, cta, instructions }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حدث خطأ في توليد النص");
      }

      const data = await res.json();
      onGenerated(data, { hook, offer, cta });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      id: "hook",
      label: "الخطاف (Hook)",
      sublabel: "جملة تجذب الانتباه",
      placeholder: "مثال: هل تعلم أن اللغة العربية من أجمل اللغات في العالم؟",
      value: hook,
      onChange: setHook,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      id: "offer",
      label: "العرض (Offer)",
      sublabel: "وصف العرض أو الخدمة",
      placeholder: "مثال: دورة تعليم اللغة العربية من الصفر مع مدرسين عرب",
      value: offer,
      onChange: setOffer,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      id: "cta",
      label: "دعوة للعمل (CTA)",
      sublabel: "ما تريد من القارئ فعله",
      placeholder: "مثال: سجل الآن واحصل على أول درس مجاناً",
      value: cta,
      onChange: setCta,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
        </svg>
      ),
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field, i) => (
        <div
          key={field.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span style={{ color: "var(--coral-400)" }}>{field.icon}</span>
            <label className="text-sm font-700" style={{ color: "var(--gray-800)" }}>
              {field.label}
            </label>
            <span className="text-xs" style={{ color: "var(--gray-400)" }}>
              — {field.sublabel}
            </span>
          </div>
          <textarea
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="input-luxury w-full px-4 py-3 text-sm leading-relaxed"
            required
          />
        </div>
      ))}

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
      <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 text-sm">
        <span className="flex items-center justify-center gap-2.5">
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جاري توليد 5 نسخ...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              ولّد 5 نسخ روسية
            </>
          )}
        </span>
      </button>
    </form>
  );
}
