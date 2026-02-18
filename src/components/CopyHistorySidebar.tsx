"use client";

import { useState } from "react";
import { AdCopyBatch, TextGenerationOutput } from "@/types";

interface Props {
  batches: AdCopyBatch[];
  onApproveCopy: (batchId: string, copyIndex: number) => void;
}

export function CopyHistorySidebar({ batches, onApproveCopy }: Props) {
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  if (batches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs" style={{ color: "var(--gray-400)" }}>
          لم يتم توليد نسخ بعد
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-1 rounded-full" style={{ background: "var(--navy-500)" }} />
        <h3 className="text-sm font-700" style={{ color: "var(--gray-800)" }}>
          سجل النسخ ({batches.length})
        </h3>
      </div>

      {batches.map((batch) => {
        const isExpanded = expandedBatch === batch.id;
        const isApproved = batch.is_approved_batch;

        return (
          <div
            key={batch.id}
            className="rounded-xl overflow-hidden transition-all duration-200"
            style={{
              border: isApproved ? "1.5px solid var(--teal-300)" : "1px solid var(--gray-200)",
              background: isApproved ? "rgba(58,155,122,0.04)" : "var(--bg-surface)",
            }}
          >
            {/* Batch header */}
            <button
              onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
              className="flex w-full items-center justify-between p-3 text-right transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isApproved && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-700"
                      style={{ background: "var(--teal-400)", color: "#FFF" }}
                    >
                      معتمدة
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "var(--gray-400)" }}>
                    {new Date(batch.created_at).toLocaleString("ar-EG", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p
                  className="truncate text-xs"
                  style={{ color: "var(--gray-600)" }}
                  dir="rtl"
                >
                  {batch.hook_ar}
                </p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 transition-transform duration-200 mr-2"
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                  color: "var(--gray-400)",
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Expanded copies */}
            {isExpanded && (
              <div className="border-t px-3 pb-3 space-y-2" style={{ borderColor: "var(--gray-200)" }}>
                {batch.copies.map((copy: TextGenerationOutput, idx: number) => {
                  const isThisApproved = isApproved && batch.approved_copy_index === idx;

                  return (
                    <div
                      key={idx}
                      className="mt-2 rounded-lg p-2.5 transition-all duration-200 cursor-pointer"
                      style={{
                        border: isThisApproved
                          ? "1.5px solid var(--teal-400)"
                          : "1px solid var(--gray-150, var(--gray-200))",
                        background: isThisApproved ? "rgba(58,155,122,0.06)" : "transparent",
                      }}
                      onClick={() => onApproveCopy(batch.id, idx)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-[10px] font-700"
                          style={{
                            color: isThisApproved ? "var(--teal-500)" : "var(--gray-400)",
                          }}
                        >
                          نسخة {idx + 1}
                        </span>
                        {isThisApproved ? (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="var(--teal-400)" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-[10px]" style={{ color: "var(--gray-400)" }}>
                            اعتمد
                          </span>
                        )}
                      </div>
                      <p dir="ltr" className="text-[11px] leading-relaxed line-clamp-3" style={{ color: "var(--gray-600)" }}>
                        {copy.hook_ru}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
