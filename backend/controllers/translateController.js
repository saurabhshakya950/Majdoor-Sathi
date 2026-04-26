import axios from 'axios';

// In-memory cache to save API costs
const translationCache = new Map();

export const translateText = async (req, res) => {
    try {
        const { texts, text, targetLang } = req.body;
        const inputTexts = texts || (text ? [text] : []);
        
        if (inputTexts.length === 0 || !targetLang) {
            return res.status(400).json({ success: false, message: 'Missing data' });
        }

        // Return original if English
        if (targetLang === 'en') {
            return res.status(200).json({ success: true, translations: inputTexts });
        }

        const cacheKey = `${inputTexts.join('|')}_${targetLang}`;
        if (translationCache.has(cacheKey)) {
            console.log("Serving from cache:", cacheKey);
            return res.status(200).json({ success: true, translations: translationCache.get(cacheKey), cached: true });
        }

        const API_KEY = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;

        // MOCK MODE if API Key is missing
        if (!API_KEY) {
            console.warn("GOOGLE_CLOUD_TRANSLATE_API_KEY is missing. Using Mock Mode.");
            const mockTranslations = inputTexts.map(t => `[${targetLang}] ${t}`);
            return res.status(200).json({ success: true, translations: mockTranslations, mock: true });
        }

        // REAL GOOGLE API CALL
        const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
        const response = await axios.post(url, {
            q: inputTexts,
            target: targetLang,
            format: 'text'
        });

        const results = response.data.data.translations.map(t => t.translatedText);
        
        // Save to cache
        translationCache.set(cacheKey, results);
        
        res.status(200).json({ success: true, translations: results });

    } catch (error) {
        console.error("Translation API Error:", error.response?.data || error.message);
        
        // Fallback to MOCK MODE even if API call fails (e.g., API not enabled, invalid key)
        const { texts, text, targetLang } = req.body;
        const inputTexts = texts || (text ? [text] : []);
        console.warn("Falling back to Mock Mode due to API error.");
        
        const mockTranslations = inputTexts.map(t => `[${targetLang}] ${t}`);
        return res.status(200).json({ success: true, translations: mockTranslations, mock: true, error: "API Failed, using mock" });
    }
};
