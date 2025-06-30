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

// ===== AUDIO CACHE SYSTEM =====
class AudioCache {
  constructor() {
    this.dbName = 'FinnishLearningAudioCache';
    this.storeName = 'audioBlobs';
    this.version = 1;
    this.db = null;
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Generate hash key from text
  async generateKey(text, speaker = 'Kore') {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${text}-${speaker}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Check if audio exists in cache
  async get(text, speaker = 'Kore') {
    if (!this.db) await this.init();
    
    const key = await this.generateKey(text, speaker);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log('🎵 Found cached audio for:', text.substring(0, 50) + '...');
          // Check if cache is still valid (e.g., 7 days)
          const isExpired = Date.now() - result.timestamp > 7 * 24 * 60 * 60 * 1000;
          if (isExpired) {
            console.log('⏰ Cached audio expired, will regenerate');
            this.delete(key);
            resolve(null);
          } else {
            resolve(result.audioBlob);
          }
        } else {
          resolve(null);
        }
      };
    });
  }

  // Store audio in cache
  async set(text, audioBlob, speaker = 'Kore') {
    if (!this.db) await this.init();
    
    const key = await this.generateKey(text, speaker);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const audioData = {
        id: key,
        text: text,
        speaker: speaker,
        audioBlob: audioBlob,
        timestamp: Date.now()
      };
      
      const request = store.put(audioData);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('💾 Cached audio for:', text.substring(0, 50) + '...');
        resolve();
      };
    });
  }

  // Delete specific cache entry
  async delete(key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Clear all cache (for maintenance)
  async clear() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('🗑️ Audio cache cleared');
        resolve();
      };
    });
  }

  // Get cache size and stats
  async getStats() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result;
        const totalSize = results.reduce((sum, item) => sum + item.audioBlob.size, 0);
        resolve({
          count: results.length,
          totalSize: totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        });
      };
    });
  }
}

const audioCache = new AudioCache();

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

// Convert PCM to WAV function
function createWAVFromPCM(pcmData, sampleRate, numChannels, bitsPerSample) {
  const dataLength = pcmData.length;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  
  // Create WAV header (44 bytes)
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // Helper function to write string to DataView
  function writeString(view, offset, text) {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  }
  
  // WAV header
  writeString(view, 0, 'RIFF');                    // ChunkID
  view.setUint32(4, 36 + dataLength, true);       // ChunkSize
  writeString(view, 8, 'WAVE');                   // Format
  writeString(view, 12, 'fmt ');                  // Subchunk1ID
  view.setUint32(16, 16, true);                   // Subchunk1Size
  view.setUint16(20, 1, true);                    // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);          // NumChannels
  view.setUint32(24, sampleRate, true);           // SampleRate
  view.setUint32(28, byteRate, true);             // ByteRate
  view.setUint16(32, blockAlign, true);           // BlockAlign
  view.setUint16(34, bitsPerSample, true);        // BitsPerSample
  writeString(view, 36, 'data');                  // Subchunk2ID
  view.setUint32(40, dataLength, true);           // Subchunk2Size
  
  // Combine header and PCM data
  const wavBuffer = new Uint8Array(header.byteLength + pcmData.length);
  wavBuffer.set(new Uint8Array(header), 0);
  wavBuffer.set(pcmData, header.byteLength);
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

// Main TTS function with caching
export const playAudioWithGemini = async (text, speaker = 'Kore', setAudioPlaying) => {
  console.log('🤖 Using Gemini 2.5 Flash TTS for Finnish:', text);
  
  try {
    setAudioPlaying(text);
    
    // Check cache first
    console.log('🔍 Checking audio cache...');
    const cachedAudio = await audioCache.get(text, speaker);
    
    if (cachedAudio) {
      console.log('⚡ Playing cached audio');
      const audioUrl = URL.createObjectURL(cachedAudio);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setAudioPlaying('');
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        console.error('❌ Cached audio playback failed');
        setAudioPlaying('');
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      return;
    }
    
    // If not cached, generate with Gemini
    console.log('🚀 Generating new audio with Gemini...');
    
    // Show progress to user
    let progressTimer;
    let timeElapsed = 0;
    
    progressTimer = setInterval(() => {
      timeElapsed += 1000;
      if (timeElapsed <= 30000) {
        console.log(`⏳ Generating enhanced audio... ${timeElapsed/1000}s`);
      }
    }, 1000);
    
    // 30 second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        clearInterval(progressTimer);
        reject(new Error('Gemini TTS timeout after 30 seconds'));
      }, 30000);
    });
    
    const geminiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{
        parts: [{
          text: text
        }]
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: speaker
            }
          },
          audioConfig: {
            sampleRateHertz: 24000,
            audioEncoding: 'LINEAR16'
          }
        }
      }
    });
    
    // Race between the Gemini request and timeout
    const response = await Promise.race([geminiPromise, timeoutPromise]);
    clearInterval(progressTimer);
    
    if (response && response.candidates && response.candidates[0]) {
      const audioData = response.candidates[0].content.parts[0].inlineData;
      if (audioData && audioData.data) {
        console.log('✅ Gemini TTS successful, audio format:', audioData.mimeType);
        
        // Handle PCM audio conversion to WAV
        const pcmData = Uint8Array.from(atob(audioData.data), c => c.charCodeAt(0));
        console.log('🎵 PCM data size:', pcmData.length, 'bytes');
        
        // Convert PCM to WAV
        const wavBlob = createWAVFromPCM(pcmData, 24000, 1, 16);
        console.log('🎵 WAV blob created, size:', wavBlob.size, 'bytes');
        
        // Cache the audio blob
        try {
          await audioCache.set(text, wavBlob, speaker);
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache audio:', cacheError);
        }
        
        const audioUrl = URL.createObjectURL(wavBlob);
        const audio = new Audio(audioUrl);
        
        audio.onloadstart = () => console.log('🔄 Audio loading started');
        audio.oncanplay = () => console.log('✅ Audio can play');
        audio.onplay = () => console.log('▶️ Audio started playing');
        
        audio.onended = () => {
          console.log('⏹️ Audio playback ended');
          setAudioPlaying('');
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = (e) => {
          console.error('❌ Audio playback failed:', e);
          setAudioPlaying('');
          URL.revokeObjectURL(audioUrl);
          throw new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`);
        };
        
        // Try to play the audio
        try {
          await audio.play();
          console.log('🎵 Audio playing successfully');
        } catch (playError) {
          console.error('❌ Play method failed:', playError);
          throw playError;
        }
        
        return;
      }
    }
    
    throw new Error('No audio data received from Gemini');
    
  } catch (error) {
    console.error('❌ Gemini TTS failed:', error);
    setAudioPlaying('');
    throw error;
  }
};

// Export cache management functions
export const clearAudioCache = async () => {
  return await audioCache.clear();
};

export const getAudioCacheStats = async () => {
  return await audioCache.getStats();
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
