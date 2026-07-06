import { useState, useRef, useCallback, useEffect } from "react";

/* ============================================================================
   Wraps the browser's native SpeechRecognition API (built into Chrome, Edge,
   and Safari — no API key, no cost, no network setup needed on our end).
   FUTURE: for guaranteed cross-browser support (Firefox doesn't implement
   this), a production version would add a server-side speech-to-text
   fallback (e.g. Whisper API), but for a prototype this covers the vast
   majority of real-world phone/tablet browsers lifeguards would use.

   Only FINAL recognized segments are surfaced via onFinalResult — interim
   (not-yet-confirmed) text is exposed separately via `interimText` for the
   lifesaver's own live feedback, but is never sent to the shared state,
   since partial speech recognition can be wrong or incomplete.
   ============================================================================ */

export function useSpeechRecognition({ onFinalResult } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState(null);
  const [supported] = useState(
    typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  const recognitionRef = useRef(null);
  const shouldBeListeningRef = useRef(false);
  const onFinalResultRef = useRef(onFinalResult);
  useEffect(() => { onFinalResultRef.current = onFinalResult; }, [onFinalResult]);

  const start = useCallback(() => {
    if (!supported) {
      setError("Voice recognition isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // lifesavers announce in English; tourists get it translated

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const finalText = result[0].transcript.trim();
          if (finalText) onFinalResultRef.current?.(finalText);
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") return; // just silence, not a real error — keep listening
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was denied. Allow microphone access to use voice broadcast.");
        shouldBeListeningRef.current = false;
        setIsListening(false);
      } else {
        setError(`Voice recognition error: ${event.error}`);
      }
    };

    // The browser API stops itself periodically even in "continuous" mode —
    // auto-restart while the lifesaver hasn't explicitly stopped it.
    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        try { recognition.start(); } catch { /* already starting — ignore */ }
      } else {
        setIsListening(false);
      }
    };

    shouldBeListeningRef.current = true;
    recognitionRef.current = recognition;
    setError(null);
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      setError("Could not start voice recognition.");
    }
  }, [supported]);

  const stop = useCallback(() => {
    shouldBeListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
  }, []);

  useEffect(() => () => { shouldBeListeningRef.current = false; recognitionRef.current?.stop(); }, []);

  return { isListening, interimText, error, supported, start, stop };
}
