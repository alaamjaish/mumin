"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchUserSettings } from "@/lib/supabase/queries";
import { DEFAULT_RUSSIAN_INSTRUCTIONS, DEFAULT_GLOBAL_IMAGE_INSTRUCTIONS } from "@/lib/prompts";
import { GalleryImageItem } from "@/types";
import type { User } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/*  Shape                                                              */
/* ------------------------------------------------------------------ */

interface AppContextValue {
  // Auth
  user: User | null;
  userLoading: boolean;

  // Settings
  russianInstructions: string;
  globalImageInstructions: string;
  setRussianInstructions: (v: string) => void;
  setGlobalImageInstructions: (v: string) => void;
  settingsLoaded: boolean;
  reloadSettings: () => Promise<void>;

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
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Settings state
  const [russianInstructions, setRussianInstructions] = useState(DEFAULT_RUSSIAN_INSTRUCTIONS);
  const [globalImageInstructions, setGlobalImageInstructions] = useState(DEFAULT_GLOBAL_IMAGE_INSTRUCTIONS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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

  // Load auth state — only update user when the ID actually changes
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      const newId = u?.id ?? null;
      if (newId !== userIdRef.current) {
        userIdRef.current = newId;
        setUser(u ?? null);
      }
      setUserLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newId = session?.user?.id ?? null;
      // Only update user state on actual sign-in/sign-out, not token refreshes
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || newId !== userIdRef.current) {
        userIdRef.current = newId;
        setUser(session?.user ?? null);
      }
      setUserLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load settings when user is available
  const loadSettings = useCallback(async () => {
    if (!user) return;
    try {
      const settings = await fetchUserSettings();
      if (settings) {
        if (settings.russian_instructions != null) {
          setRussianInstructions(settings.russian_instructions);
        }
        if (settings.global_image_instructions != null) {
          setGlobalImageInstructions(settings.global_image_instructions);
        }
      }
      setSettingsLoaded(true);
    } catch {
      setSettingsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user, loadSettings]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      userLoading,
      russianInstructions,
      globalImageInstructions,
      setRussianInstructions,
      setGlobalImageInstructions,
      settingsLoaded,
      reloadSettings: loadSettings,
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
      user,
      userLoading,
      russianInstructions,
      globalImageInstructions,
      settingsLoaded,
      loadSettings,
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
