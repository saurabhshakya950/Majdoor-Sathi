const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Sends a batch of texts to the backend for translation.
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code (e.g., 'hi', 'en')
 * @returns {Promise<string[]>} - Array of translated texts or original if failed
 */
export const translateBatch = async (texts, targetLang) => {
  if (!texts || texts.length === 0) return [];
  if (targetLang === 'en') return texts;

  try {
    const response = await fetch(`${API_BASE_URL}/translate/batch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ texts, targetLang })
    });
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.translations)) {
      return data.translations;
    }
    
    console.error("Translation API error:", data.message);
    return texts; // Fallback to original
  } catch (error) {
    console.error("Translation service error:", error);
    return texts; // Fallback to original
  }
};
