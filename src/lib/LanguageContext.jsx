import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  formatCount,
  t,
  toBengaliNumber,
  translateArea,
  translateBestTimeRecommended,
  translateBestTimeWhy,
  translateCategory,
  translateCaution,
  translateDistrict,
  translateDivision,
  translateHowToReach,
  translatePlaceDescription,
  translatePlaceName,
} from "./i18n.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === "en" || stored === "bn") return stored;
    } catch {
      /* ignore storage read error */
    }
    return DEFAULT_LANGUAGE;
  });

  const setLang = (nextLang) => {
    if (nextLang !== "en" && nextLang !== "bn") return;
    setLangState(nextLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    } catch {
      /* ignore storage write error */
    }
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "bn" : "en");
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const isBn = lang === "bn";
    return {
      lang,
      setLang,
      toggleLang,
      isBn,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t: (key, params) => t(key, lang, params),
      translateDistrict: (dist) => translateDistrict(dist, lang),
      translateArea: (area) => translateArea(area, lang),
      translateDivision: (div) => translateDivision(div, lang),
      translateCategory: (cat) => translateCategory(cat, lang),
      translatePlaceName: (place) => translatePlaceName(place, lang),
      translatePlaceDescription: (place) => translatePlaceDescription(place, lang),
      translateHowToReach: (place) => translateHowToReach(place, lang),
      translateBestTimeWhy: (place) => translateBestTimeWhy(place, lang),
      translateBestTimeRecommended: (rec) => translateBestTimeRecommended(rec, lang),
      translateCaution: (place) => translateCaution(place, lang),
      toBengaliNumber: (num) => (isBn ? toBengaliNumber(num) : num),
      formatCount: (cnt, enSuffix, bnSuffix) => formatCount(cnt, lang, enSuffix, bnSuffix),
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for non-provider renders or isolated tests
    return {
      lang: DEFAULT_LANGUAGE,
      setLang: () => {},
      toggleLang: () => {},
      isBn: false,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t: (key, params) => t(key, DEFAULT_LANGUAGE, params),
      translateDistrict: (dist) => translateDistrict(dist, DEFAULT_LANGUAGE),
      translateArea: (area) => translateArea(area, DEFAULT_LANGUAGE),
      translateDivision: (div) => translateDivision(div, DEFAULT_LANGUAGE),
      translateCategory: (cat) => translateCategory(cat, DEFAULT_LANGUAGE),
      translatePlaceName: (place) => translatePlaceName(place, DEFAULT_LANGUAGE),
      translatePlaceDescription: (place) => translatePlaceDescription(place, DEFAULT_LANGUAGE),
      translateHowToReach: (place) => translateHowToReach(place, DEFAULT_LANGUAGE),
      translateBestTimeWhy: (place) => translateBestTimeWhy(place, DEFAULT_LANGUAGE),
      translateCaution: (place) => translateCaution(place, DEFAULT_LANGUAGE),
      toBengaliNumber: (num) => num,
      formatCount: (cnt, enSuffix, bnSuffix) => formatCount(cnt, DEFAULT_LANGUAGE, enSuffix, bnSuffix),
    };
  }
  return context;
}

export function LanguageSwitcher({ className = "" }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className={`lang-switcher ${className}`} role="group" aria-label="Language selection">
      <button
        type="button"
        className={`lang-btn ${lang === "en" ? "active" : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        title="English"
      >
        EN
      </button>
      <span className="lang-sep" aria-hidden="true">|</span>
      <button
        type="button"
        className={`lang-btn ${lang === "bn" ? "active" : ""}`}
        onClick={() => setLang("bn")}
        aria-pressed={lang === "bn"}
        title="বাংলা"
      >
        বাংলা
      </button>
    </div>
  );
}
