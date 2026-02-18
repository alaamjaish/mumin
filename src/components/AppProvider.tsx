"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ApprovedTextContext,
  GalleryImageItem,
  TextGenerationInput,
  TextGenerationOutput,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  Shape                                                             */
/* ------------------------------------------------------------------ */

interface AppContextValue {
  // Generate page
  generateResults: TextGenerationOutput[];
  generateInput: TextGenerationInput | null;
  setGenerateResults: (r: TextGenerationOutput[]) => void;
  setGenerateInput: (i: TextGenerationInput | null) => void;

  // Images page
  approvedContext: ApprovedTextContext | null;
  russianText: TextGenerationOutput | null;
  draftImages: GalleryImageItem[];
  setApprovedContext: (c: ApprovedTextContext | null) => void;
  setRussianText: (t: TextGenerationOutput | null) => void;
  setDraftImages: Dispatch<SetStateAction<GalleryImageItem[]>>;
  imagesHydrated: boolean;
  markImagesHydrated: () => void;

  // Gallery page
  galleryImages: GalleryImageItem[];
  galleryLoading: boolean;
  galleryError: string;
  galleryLoaded: boolean;
  setGalleryImages: (imgs: GalleryImageItem[]) => void;
  setGalleryLoading: (v: boolean) => void;
  setGalleryError: (e: string) => void;
  markGalleryLoaded: () => void;
  invalidateGallery: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function AppProvider({ children }: { children: ReactNode }) {
  // Generate page state
  const [generateResults, setGenerateResults] = useState<TextGenerationOutput[]>([]);
  const [generateInput, setGenerateInput] = useState<TextGenerationInput | null>(null);

  // Images page state
  const [approvedContext, setApprovedContext] = useState<ApprovedTextContext | null>(null);
  const [russianText, setRussianText] = useState<TextGenerationOutput | null>(null);
  const [draftImages, setDraftImages] = useState<GalleryImageItem[]>([]);
  const [imagesHydrated, setImagesHydrated] = useState(false);
  const markImagesHydrated = useCallback(() => setImagesHydrated(true), []);

  // Gallery page state
  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState("");
  const galleryLoadedRef = useRef(false);
  const [galleryLoaded, setGalleryLoaded] = useState(false);

  const markGalleryLoaded = useCallback(() => {
    galleryLoadedRef.current = true;
    setGalleryLoaded(true);
  }, []);

  const invalidateGallery = useCallback(() => {
    galleryLoadedRef.current = false;
    setGalleryLoaded(false);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      generateResults,
      generateInput,
      setGenerateResults,
      setGenerateInput,
      approvedContext,
      russianText,
      draftImages,
      setApprovedContext,
      setRussianText,
      setDraftImages,
      imagesHydrated,
      markImagesHydrated,
      galleryImages,
      galleryLoading,
      galleryError,
      galleryLoaded,
      setGalleryImages,
      setGalleryLoading,
      setGalleryError,
      markGalleryLoaded,
      invalidateGallery,
    }),
    [
      generateResults,
      generateInput,
      approvedContext,
      russianText,
      draftImages,
      imagesHydrated,
      markImagesHydrated,
      galleryImages,
      galleryLoading,
      galleryError,
      galleryLoaded,
      markGalleryLoaded,
      invalidateGallery,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
