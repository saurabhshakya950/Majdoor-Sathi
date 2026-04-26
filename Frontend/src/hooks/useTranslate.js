import { useState, useEffect, useRef } from 'react';
import { translateBatch } from '../services/translationService';

/**
 * Custom hook to handle batch translation of text strings.
 * @param {string[]} textList - Array of strings to translate.
 * @param {string} currentLang - Target language code (e.g., 'hi').
 * @returns {Object} - { translations, loading }
 */
export const useTranslate = (textList, currentLang) => {
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef({});

  useEffect(() => {
    // Return early if no text or language is English
    if (!textList || textList.length === 0) return;
    
    if (currentLang === 'en') {
      const enDict = {};
      textList.forEach(text => { enDict[text] = text; });
      setTranslations(enDict);
      return;
    }

    const fetchTranslations = async () => {
      // Check if we already have these translations for this language in our ref cache
      const cacheKey = `${currentLang}_${JSON.stringify(textList)}`;
      if (cacheRef.current[cacheKey]) {
        setTranslations(cacheRef.current[cacheKey]);
        return;
      }

      setLoading(true);
      try {
        const results = await translateBatch(textList, currentLang);
        
        const newDict = {};
        textList.forEach((original, index) => {
          newDict[original] = results[index] || original;
        });

        // Save to component-level cache
        cacheRef.current[cacheKey] = newDict;
        setTranslations(newDict);
      } catch (error) {
        console.error("Hook translation failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();
  }, [currentLang, JSON.stringify(textList)]);

  return { translations, loading };
};
