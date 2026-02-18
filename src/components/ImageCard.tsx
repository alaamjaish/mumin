"use client";

interface Props {
  id: string;
  imageUrl: string;
  style: string;
  isSelected: boolean;
  onSelect: () => void;
  isLocalSaved?: boolean;
  isCloudSaved?: boolean;
  isSavingCloud?: boolean;
  onSaveLocal?: (id: string) => void;
  onSaveCloud?: (id: string) => void;
}

export function ImageCard({
  id,
  imageUrl,
  style,
  isSelected,
  onSelect,
  isLocalSaved = false,
  isCloudSaved = false,
  isSavingCloud = false,
  onSaveLocal,
  onSaveCloud,
}: Props) {
  function handleDownload() {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `mumin-${style}-${Date.now()}.png`;
    link.click();
  }

  return (
    <div
      className="group relative overflow-hidden rounded-xl transition-all duration-300"
      style={{
        border: isSelected
          ? "2px solid var(--teal-400)"
          : "2px solid var(--gray-200)",
        boxShadow: isSelected ? "var(--shadow-teal)" : "var(--shadow-sm)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`Ad image - ${style}`}
        className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Cloud saved badge */}
      {isCloudSaved && (
        <div
          className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-700 animate-scale-in"
          style={{
            background: "var(--teal-400)",
            color: "#FFF",
            fontFamily: "var(--font-body)",
            letterSpacing: "0.02em",
          }}
        >
          Cloud saved
        </div>
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex items-end opacity-0 transition-all duration-300 group-hover:opacity-100"
        style={{
          background: "linear-gradient(to top, rgba(26,22,19,0.85) 0%, rgba(26,22,19,0.3) 45%, transparent 70%)",
        }}
      >
        <div className="flex w-full items-center justify-between p-3">
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-500"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#FFF",
              backdropFilter: "blur(4px)",
              fontFamily: "var(--font-body)",
            }}
          >
            {style}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              onClick={handleDownload}
              className="rounded-md px-2.5 py-1 text-[11px] font-500 transition-all"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#FFF",
                backdropFilter: "blur(4px)",
              }}
            >
              تحميل
            </button>
            {onSaveLocal && (
              <button
                onClick={() => onSaveLocal(id)}
                disabled={isLocalSaved}
                className="rounded-md px-2.5 py-1 text-[11px] font-500 transition-all disabled:opacity-50"
                style={{
                  background: isLocalSaved ? "rgba(58,155,122,0.3)" : "rgba(255,255,255,0.15)",
                  color: "#FFF",
                  backdropFilter: "blur(4px)",
                }}
              >
                {isLocalSaved ? "محفوظ" : "حفظ"}
              </button>
            )}
            {onSaveCloud && (
              <button
                onClick={() => onSaveCloud(id)}
                disabled={isCloudSaved || isSavingCloud}
                className="rounded-md px-2.5 py-1 text-[11px] font-500 transition-all disabled:opacity-50"
                style={{
                  background: isCloudSaved ? "rgba(58,155,122,0.3)" : "var(--navy-500)",
                  color: "#FFF",
                }}
              >
                {isCloudSaved ? "سحابي" : isSavingCloud ? "..." : "سحابة"}
              </button>
            )}
            <button
              onClick={onSelect}
              className="rounded-md px-2.5 py-1 text-[11px] font-600 transition-all"
              style={{
                background: isSelected ? "var(--teal-400)" : "var(--coral-400)",
                color: "#FFF",
              }}
            >
              {isSelected ? "✓" : "اختر"}
            </button>
          </div>
        </div>
      </div>

      {/* Selection badge */}
      {isSelected && (
        <div
          className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full animate-scale-in"
          style={{
            background: "var(--teal-400)",
            boxShadow: "0 2px 8px rgba(58,155,122,0.4)",
          }}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#FFF" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
