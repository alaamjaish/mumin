"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAd } from "@/lib/supabase/queries";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAdDialog({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");
    try {
      const ad = await createAd(title.trim());
      onCreated();
      router.push(`/ad/${ad.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في إنشاء الإعلان");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card w-full max-w-md p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--gray-900)" }}>
          إعلان جديد
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-500" style={{ color: "var(--gray-700)" }}>
              عنوان الإعلان
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-luxury w-full px-4 py-3 text-sm"
              placeholder="مثال: حملة رمضان 2026"
              autoFocus
              required
            />
          </div>

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

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-ghost rounded-xl px-5 py-2.5 text-sm">
              إلغاء
            </button>
            <button type="submit" disabled={loading || !title.trim()} className="btn-gold rounded-xl px-6 py-2.5 text-sm">
              {loading ? "جاري الإنشاء..." : "إنشاء"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
