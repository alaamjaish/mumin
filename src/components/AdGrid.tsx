"use client";

import { useState } from "react";
import Link from "next/link";
import { Ad } from "@/types";
import { DeleteAdDialog } from "./DeleteAdDialog";

interface Props {
  ads: Ad[];
  onRefresh: () => void;
}

export function AdGrid({ ads, onRefresh }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad, i) => (
          <div
            key={ad.id}
            className="group relative animate-fade-in-up"
            style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
          >
            <Link
              href={`/ad/${ad.id}`}
              className="glass-card block p-5 transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-base font-700 leading-snug" style={{ color: "var(--gray-800)" }}>
                  {ad.title}
                </h3>
              </div>
              <p className="text-xs" style={{ color: "var(--gray-400)" }}>
                {new Date(ad.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </Link>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteTarget(ad);
              }}
              className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:opacity-100"
              style={{ background: "var(--gray-100)", color: "var(--gray-400)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(217,79,51,0.1)";
                e.currentTarget.style.color = "var(--error)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gray-100)";
                e.currentTarget.style.color = "var(--gray-400)";
              }}
              title="حذف الإعلان"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <DeleteAdDialog
          adId={deleteTarget.id}
          adTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}
