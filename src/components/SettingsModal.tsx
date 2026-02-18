"use client";

import { useState } from "react";
import { useAppContext } from "./AppProvider";
import { upsertUserSettings } from "@/lib/supabase/queries";
import { DEFAULT_RUSSIAN_INSTRUCTIONS, DEFAULT_GLOBAL_IMAGE_INSTRUCTIONS } from "@/lib/prompts";

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const ctx = useAppContext();
  const [apiKey, setApiKey] = useState(ctx.geminiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [russianInstructions, setRussianInstructions] = useState(ctx.russianInstructions);
  const [globalImageInstructions, setGlobalImageInstructions] = useState(ctx.globalImageInstructions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      // Save API key to localStorage via context
      ctx.setGeminiApiKey(apiKey.trim());

      // Save instructions to Supabase
      await upsertUserSettings(russianInstructions, globalImageInstructions);
      ctx.setRussianInstructions(russianInstructions);
      ctx.setGlobalImageInstructions(globalImageInstructions);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    setRussianInstructions(DEFAULT_RUSSIAN_INSTRUCTIONS);
    setGlobalImageInstructions(DEFAULT_GLOBAL_IMAGE_INSTRUCTIONS);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixed at top */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-8 pb-4" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          <h2 className="text-xl font-bold" style={{ color: "var(--gray-900)" }}>
            الإعدادات
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--gray-400)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-100)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6">
          <div className="space-y-6">
            {/* Gemini API Key */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--teal-400)" }} />
                <label className="text-sm font-700" style={{ color: "var(--gray-800)" }}>
                  Gemini API Key
                </label>
              </div>
              <p className="mb-2 text-xs" style={{ color: "var(--gray-400)" }}>
                مفتاح API الخاص بك — يُحفظ في متصفحك فقط ولا يُرسل لأي سيرفر
              </p>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  dir="ltr"
                  className="input-luxury w-full pl-4 pr-12 py-3 text-sm"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                  style={{ color: "var(--gray-400)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gray-600)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
                >
                  {showApiKey ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {!apiKey.trim() && (
                <p className="mt-1.5 text-xs" style={{ color: "var(--coral-400)" }}>
                  ⚠ لن يعمل توليد النصوص والصور بدون المفتاح
                </p>
              )}
            </div>

            {/* Russian Instructions */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--coral-400)" }} />
                <label className="text-sm font-700" style={{ color: "var(--gray-800)" }}>
                  تعليمات التوليد الروسي (عامة)
                </label>
              </div>
              <p className="mb-2 text-xs" style={{ color: "var(--gray-400)" }}>
                هذه التعليمات تُستخدم لتوليد النصوص الروسية في جميع الإعلانات
              </p>
              <textarea
                value={russianInstructions}
                onChange={(e) => setRussianInstructions(e.target.value)}
                rows={10}
                dir="rtl"
                className="input-luxury w-full px-4 py-3 text-xs leading-relaxed"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>

            {/* Global Image Instructions */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--navy-500)" }} />
                <label className="text-sm font-700" style={{ color: "var(--gray-800)" }}>
                  تعليمات الصور العامة
                </label>
              </div>
              <p className="mb-2 text-xs" style={{ color: "var(--gray-400)" }}>
                تعليمات مشتركة لجميع الإعلانات — مثل: الجمهور المستهدف، الثيم البصري العام
              </p>
              <textarea
                value={globalImageInstructions}
                onChange={(e) => setGlobalImageInstructions(e.target.value)}
                rows={5}
                dir="ltr"
                className="input-luxury w-full px-4 py-3 text-sm leading-relaxed"
                placeholder="Example: target audience is Russian women 25-40, use warm colors, include hijab-wearing women..."
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(217,79,51,0.06)",
                  border: "1px solid rgba(217,79,51,0.12)",
                  color: "var(--error)",
                }}
              >
                {error}
              </div>
            )}

          </div>
        </div>

        {/* Actions — sticky at bottom */}
        <div
          className="flex items-center justify-between px-6 sm:px-8 py-4"
          style={{ borderTop: "1px solid var(--gray-200)" }}
        >
          <button
            onClick={handleResetDefaults}
            className="text-xs font-500 transition-colors duration-200"
            style={{ color: "var(--gray-400)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--coral-400)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
          >
            استعادة الافتراضي
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-ghost rounded-xl px-5 py-2.5 text-sm"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-gold rounded-xl px-6 py-2.5 text-sm"
            >
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
