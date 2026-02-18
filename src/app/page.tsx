"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/AppProvider";
import { AdGrid } from "@/components/AdGrid";
import { CreateAdDialog } from "@/components/CreateAdDialog";
import { fetchAds } from "@/lib/supabase/queries";
import { Ad } from "@/types";

export default function DashboardPage() {
  const { user, userLoading } = useAppContext();
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAds();
      setAds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في تحميل الإعلانات");
    } finally {
      setLoading(false);
    }
  }, []);

  const dataLoadedRef = useRef(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;
    loadAds();
  }, [user, userLoading, router, loadAds]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: "var(--coral-400)" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1.5" style={{ color: "var(--gray-900)" }}>
            مولد الإعلانات
          </h1>
          <p className="text-sm" style={{ color: "var(--gray-500)" }}>
            أنشئ إعلانات جديدة أو تابع العمل على إعلانات سابقة
          </p>
        </div>

        {/* Small add button */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-600 transition-all duration-200"
          style={{
            background: "rgba(200, 50, 40, 0.08)",
            color: "#c83228",
            border: "1px solid rgba(200, 50, 40, 0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(200, 50, 40, 0.15)";
            e.currentTarget.style.borderColor = "rgba(200, 50, 40, 0.25)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(200, 50, 40, 0.08)";
            e.currentTarget.style.borderColor = "rgba(200, 50, 40, 0.15)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          إعلان جديد
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-scale-in rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(217,79,51,0.06)",
            border: "1px solid rgba(217,79,51,0.12)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: "var(--coral-400)" }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Ad Grid */}
      {!loading && <AdGrid ads={ads} onRefresh={loadAds} />}

      {/* Create Ad Dialog */}
      {showCreate && (
        <CreateAdDialog
          onClose={() => setShowCreate(false)}
          onCreated={loadAds}
        />
      )}
    </div>
  );
}

