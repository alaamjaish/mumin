"use client";

import { useRouter } from "next/navigation";
import { TextGenerationForm } from "@/components/TextGenerationForm";
import { RussianTextOutput } from "@/components/RussianTextOutput";
import { useAppContext } from "@/components/AppProvider";
import { ApprovedTextContext, TextGenerationOutput } from "@/types";

const DRAFT_IMAGES_SESSION_KEY = "mumin.generated.draft.images";
const CLOUD_GENERATION_CACHE_KEY = "mumin.cloud.generation.cache";

export default function GeneratePage() {
  const {
    generateResults: results,
    generateInput: input,
    setGenerateResults: setResults,
    setGenerateInput: setInput,
    setApprovedContext,
    setRussianText,
    setDraftImages,
    markImagesHydrated,
    invalidateGallery,
  } = useAppContext();
  const router = useRouter();

  function handleApprove(approved: TextGenerationOutput) {
    if (!input) {
      return;
    }

    const context: ApprovedTextContext = { input, approved };
    sessionStorage.setItem("approvedTextContext", JSON.stringify(context));
    sessionStorage.setItem("russianText", JSON.stringify(approved));
    sessionStorage.removeItem(DRAFT_IMAGES_SESSION_KEY);
    sessionStorage.removeItem(CLOUD_GENERATION_CACHE_KEY);

    // Push to shared context so images page doesn't need to re-read sessionStorage
    setApprovedContext(context);
    setRussianText(approved);
    setDraftImages([]);
    markImagesHydrated();
    invalidateGallery();

    router.push("/images");
  }

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              background: "var(--coral-50)",
              color: "var(--coral-500)",
              fontFamily: "var(--font-body)",
            }}
          >
            01
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--gray-900)" }}
          >
            توليد النص الروسي
          </h1>
        </div>
        <p className="mr-12 text-sm" style={{ color: "var(--gray-500)" }}>
          أدخل محتوى الإعلان بالعربية وسيتم توليد 5 نسخ روسية مختلفة للمقارنة
        </p>
      </div>

      {/* Form card */}
      <div className="glass-card mx-auto max-w-2xl p-6 sm:p-8">
        <TextGenerationForm
          onGenerated={(nextResults, nextInput) => {
            setResults(nextResults);
            setInput(nextInput);
          }}
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <RussianTextOutput results={results} onApprove={handleApprove} />
        </div>
      )}
    </div>
  );
}
