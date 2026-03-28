"use client";

import { useEffect } from "react";
import {
  FONT_SCALE_STORAGE_KEY,
  parseStoredFontScale,
} from "@/lib/preferences";

export default function UserPreferencesInitializer() {
  useEffect(() => {
    const storedScale = parseStoredFontScale(
      localStorage.getItem(FONT_SCALE_STORAGE_KEY),
    );
    document.documentElement.style.setProperty(
      "--app-font-scale",
      String(storedScale),
    );
  }, []);

  return null;
}
