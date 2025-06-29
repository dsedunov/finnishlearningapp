import { GoogleGenAI } from '@google/genai';

// Initialize Google AI
const ai = new GoogleGenAI({
  apiKey: process.env.REACT_APP_GEMINI_API_KEY || ''
});

// Helper function to clean AI responses
const cleanAIResponse = (responseText) => {
  // Remove markdown code block markers
  let cleaned = responseText.replace(/``````|``````\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Handle BOM characters that might cause parsing issues
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.slice(1);
  }
  
  return cleaned;
};

// Helper function to extract text from Gemini response
const extractResponseText = (response) => {
  if (response.response && response.response.text) {
    return response.response.text();
  } else if (response.text) {
    return response.text;
  } else if (response.candidates && response.candidates[0]) {
    return response.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Unexpected response structure from Gemini API');
  }
};

// Rate limiting for free tier
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class FreetierRequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.requestTimes = [];
    this.maxRequestsPerMinute = 10;
    this.maxRequestsPerDay = 50;
    this.dailyRequestCount = this.getDailyRequestCount();
  }

  getDailyRequestCount() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('gemini_daily_requests');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data.count;
      }
    }
    return 0;
  }

  updateDailyRequestCount() {
    const today = new Date().toDateString();
    this.dailyRequestCount++;
    localStorage.setItem('gemini_daily_requests', JSON.stringify({
      date: today,
      count: this.dailyRequestCount
    }));
  }

  async addRequest(requestFn) {
    if (this.dailyRequestCount >= this.maxRequestsPerDay) {
      throw new Error('Daily API limit reached. Please try again tomorrow.');
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
      
      if (this.requestTimes.length >= this.maxRequestsPerMinute) {
        const oldestRequest = Math.min(...this.requestTimes);
        const waitTime = 60000 - (now - oldestRequest) + 2000;
        await delay(waitTime);
        continue;
      }
      
      const { requestFn, resolve, reject } = this.queue.shift();
      
      try {
        this.requestTimes.push(now);
        this.updateDailyRequestCount();
        const result = await requestFn();
        resolve(result);
        await delay(3000);
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }
}

// Global queue instance
const aiRequestQueue = new FreetierRequestQueue();

// Enhanced translation function
export const getEnhancedTranslation = async (word) => {
  try {
    return await aiRequestQueue.addRequest(async () => {
      const prompt = `Translate Finnish word "${word}" to Russian. 

IMPORTANT: Respond with ONLY the JSON object, no markdown formatting, no code blocks, no explanations.

{"word":"${word}","translation":"Russian translation","partOfSpeech":"noun/verb/adj","difficulty":"beginner/intermediate/advanced","examples":["example1","example2"],"etymology":"brief origin"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 0.1,
        }
      });
      
      const text = extractResponseText(response);
      const cleanedText = cleanAIResponse(text);
      
      let translation;
      try {
        translation = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Cleaned text that failed to parse:', cleanedText);
        throw new Error('AI returned invalid JSON format');
      }
      
      return {
        success: true,
        data: translation
      };
    });
  } catch (error) {
    console.error('Gemini translation failed:', error);
    
    if (error.message.includes('429') || error.message.includes('quota')) {
      return {
        success: false,
        error: 'Free tier limit reached. Please wait or try again later.',
        retryAfter: 3600000
      };
    }
    
    if (error.message.includes('Daily API limit')) {
      return {
        success: false,
        error: 'Daily free tier limit reached. Try again tomorrow.',
        retryAfter: 86400000
      };
    }
    
    return {
      success: false,
      error: 'Translation unavailable. Using offline mode.',
      fallback: `Translation for "${word}" not available`
    };
  }
};

// Enhanced AI analysis with better data handling
export const enhanceTranslationWithAI = async (word, baseTranslation) => {
  try {
    return await aiRequestQueue.addRequest(async () => {
      const prompt = `Analyze Finnish "${word}". 

IMPORTANT: Respond with ONLY the JSON object, no markdown formatting, no code blocks, no explanations.

{"partOfSpeech":"noun/verb/adj","case":"nom/part/gen/null","difficulty":"beginner/intermediate/advanced","note":"brief usage note","examples":["example1","example2"],"etymology":"brief origin"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 0.1,
        }
      });
      
      const text = extractResponseText(response);
      const cleanedText = cleanAIResponse(text);
      
      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON Parse Error in AI analysis:', parseError);
        return {
          base: baseTranslation,
          ai: {
            grammaticalInfo: {
              partOfSpeech: 'unknown',
              case: null,
              number: null,
              wordType: 'basic'
            },
            difficulty: 'beginner',
            usageNotes: 'Analysis temporarily unavailable',
            examples: [],
            relatedWords: [],
            pronunciation: null
          },
          enhanced: true
        };
      }
      
      return {
        base: baseTranslation,
        ai: {
          grammaticalInfo: {
            partOfSpeech: aiAnalysis.partOfSpeech || 'unknown',
            case: aiAnalysis.case || null,
            number: null,
            wordType: 'basic'
          },
          difficulty: aiAnalysis.difficulty || 'beginner',
          usageNotes: aiAnalysis.note || 'No usage notes available',
          // Only show etymology if we have real data
          etymology: aiAnalysis.etymology && aiAnalysis.etymology !== 'brief origin' 
            ? aiAnalysis.etymology 
            : null,
          // Only show formation rules if we have real data  
          formationRules: aiAnalysis.etymology && aiAnalysis.etymology !== 'brief origin'
            ? `Word formation: ${aiAnalysis.etymology}`
            : null,
          // Only show examples if we have real data
          examples: aiAnalysis.examples && aiAnalysis.examples.length > 0 
            ? aiAnalysis.examples.map(ex => ({
                finnish: ex,
                english: `Example using "${word}"`
              }))
            : [],
          relatedWords: [],
          pronunciation: null
        },
        enhanced: true
      };
    });
  } catch (error) {
    console.error('AI enhancement failed:', error);
    
    return {
      base: baseTranslation,
      ai: null,
      enhanced: false,
      error: error.message.includes('limit') ? 'Free tier limit reached' : 'Analysis unavailable'
    };
  }
};

// Get current usage stats
export const getUsageStats = () => {
  const today = new Date().toDateString();
  const stored = localStorage.getItem('gemini_daily_requests');
  let dailyUsed = 0;
  
  if (stored) {
    const data = JSON.parse(stored);
    if (data.date === today) {
      dailyUsed = data.count;
    }
  }
  
  return {
    dailyUsed,
    dailyLimit: 50,
    remaining: Math.max(0, 50 - dailyUsed),
    resetTime: 'Tomorrow'
  };
};
