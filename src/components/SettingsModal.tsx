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
  const [russianInstructions, setRussianInstructions] = useState(ctx.russianInstructions);
  const [globalImageInstructions, setGlobalImageInstructions] = useState(ctx.globalImageInstructions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
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
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
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

        <div className="space-y-6">
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
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
    </div>
  );
}
