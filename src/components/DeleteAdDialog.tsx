"use client";

import { useState } from "react";
import { deleteAd } from "@/lib/supabase/queries";

interface Props {
  adId: string;
  adTitle: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteAdDialog({ adId, adTitle, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      await deleteAd(adId);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في حذف الإعلان");
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
        className="glass-card w-full max-w-sm p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg font-bold" style={{ color: "var(--gray-900)" }}>
          حذف الإعلان؟
        </h2>
        <p className="mb-5 text-sm" style={{ color: "var(--gray-500)" }}>
          سيتم حذف &quot;{adTitle}&quot; مع جميع النسخ المرتبطة. لا يمكن التراجع.
        </p>

        {error && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
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
          <button onClick={onClose} className="btn-ghost rounded-xl px-5 py-2.5 text-sm">
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl px-6 py-2.5 text-sm font-700 text-white transition-all"
            style={{ background: "var(--error)" }}
          >
            {loading ? "جاري الحذف..." : "حذف"}
          </button>
        </div>
      </div>
    </div>
  );
}
