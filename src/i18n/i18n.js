import { UI_STRINGS } from "./uiStrings";
import { HAZARD_MARKER_TRANSLATIONS } from "./hazardMarkerTranslations";

/* ============================================================================
   Simple i18n helper. t(lang, key, vars) looks up the string for the given
   language, falls back to English if the language or key is somehow
   missing (should never happen — build_i18n.py verified all 7 languages
   have identical key sets), and replaces {placeholders} with values from
   `vars`.

   FUTURE: for a much larger app, a library like i18next would add pluralization,
   date/number formatting, and lazy-loading per language. For this app's
   scope (one screen's worth of strings, one flat namespace), a plain
   lookup table is simpler and has zero extra dependencies.
   ============================================================================ */

export function t(lang, key, vars) {
  const dict = UI_STRINGS[lang] || UI_STRINGS.en;
  let str = dict[key] ?? UI_STRINGS.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    });
  }
  return str;
}

// Translates a hazard marker's label — used when a tourist taps a pin on
// the map. Falls back to English + a note for hazard markers an admin
// created that aren't in the pre-seeded translation set (same honest
// fallback pattern used for custom-edited alert text).
export function translateHazardMarker(hazard, lang) {
  if (lang === "en") return { text: hazard.label, isFallback: false };
  const entry = HAZARD_MARKER_TRANSLATIONS[hazard.id];
  if (entry && entry[lang]) return { text: entry[lang], isFallback: false };
  return { text: hazard.label, isFallback: true };
}

// Native-language names for the language picker — kept separate from
// UI_STRINGS since these never change per selected language (e.g. "日本語"
// is always "日本語" no matter what language is currently active).
export const LANGUAGE_NAMES = {
  en: { label: "English", native: "English" },
  zh: { label: "Chinese", native: "中文" },
  ja: { label: "Japanese", native: "日本語" },
  ko: { label: "Korean", native: "한국어" },
  es: { label: "Spanish", native: "Español" },
  fr: { label: "French", native: "Français" },
  de: { label: "German", native: "Deutsch" },
};
