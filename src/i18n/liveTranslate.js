/* ============================================================================
   Translates ARBITRARY text (e.g. a lifeguard's spoken announcement,
   transcribed live) — this is fundamentally different from uiStrings.js and
   the preset alert dictionary, which only cover known, pre-written phrases.
   Free-form speech can't be pre-translated, so this makes a real network
   call to a free public translation API (MyMemory — no API key required).

   HONESTY NOTE: MyMemory's free/anonymous tier is rate-limited (roughly a
   few thousand words/day) and is a best-effort public service, not a paid
   SLA-backed product. It's genuinely useful for a prototype and demos, but
   a real production deployment handling real lifeguard broadcasts should
   use a paid, reliable service (Google Cloud Translation, DeepL API, Azure
   Translator) with the API key held server-side — never in client code,
   since anyone could otherwise read it from the browser and run up usage.
   ============================================================================ */

// Our app's language codes -> MyMemory's expected codes (mostly identical;
// Chinese needs the region suffix).
const MYMEMORY_LANG_CODES = { zh: "zh-CN", ja: "ja", ko: "ko", es: "es", fr: "fr", de: "de" };

export async function translateSpokenText(text, targetLangCode) {
  if (targetLangCode === "en") return { text, ok: true };
  const mmCode = MYMEMORY_LANG_CODES[targetLangCode];
  if (!mmCode) return { text, ok: false };

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${mmCode}`;
    const res = await fetch(url);
    if (!res.ok) return { text, ok: false };
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || typeof translated !== "string") return { text, ok: false };
    return { text: translated, ok: true };
  } catch {
    return { text, ok: false }; // network error, rate limit, etc. — caller falls back to English
  }
}

// Translates one utterance into every offered non-English language in
// parallel. Returns a map of {langCode: translatedText}; entries that
// failed are simply omitted, so the caller can fall back to English for
// just that language rather than losing the whole broadcast.
export async function translateToAllLanguages(text) {
  const codes = Object.keys(MYMEMORY_LANG_CODES);
  const results = await Promise.all(codes.map((code) => translateSpokenText(text, code)));
  const map = {};
  codes.forEach((code, i) => {
    if (results[i].ok) map[code] = results[i].text;
  });
  return map;
}
