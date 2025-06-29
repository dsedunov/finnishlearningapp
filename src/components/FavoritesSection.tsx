import React, { useState, useEffect } from 'react';
import { Heart, Volume2, Mic, X, Star } from 'lucide-react';
import { enhanceTranslationWithAI } from '../utils/geminiAI';

interface FavoritesSectionProps {
  favorites: any[];
  audioPlaying: string | null;
  isListening: boolean;
  onPlayAudio: (text: string, voiceType?: string) => void;
  onStartSpeechRecognition: (text: string) => void;
  onRemoveFromFavorites: (word: string) => void;
  onGoToTheory: () => void;
}

// Cache management functions with detailed logging
const AI_CACHE_KEY = 'finnishApp_aiEnhancedTranslations';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
};

const getAITranslationCache = (): {[key: string]: any} => {
  try {
    console.log('Reading AI translation cache from localStorage...');
    const cached = localStorage.getItem(AI_CACHE_KEY);
    const result = cached ? JSON.parse(cached) : {};
    console.log('Cache status:', {
      exists: !!cached,
      wordCount: Object.keys(result).length,
      sizeKB: cached ? Math.round(cached.length / 1024 * 100) / 100 : 0
    });
    return result;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Error reading AI cache:', errorMessage);
    return {};
  }
};

const updateAITranslationCache = (word: string, aiTranslation: any): void => {
  try {
    console.log('Attempting to cache AI translation for word:', word);
    console.log('Translation data to cache:', {
      hasAI: !!aiTranslation.ai,
      enhanced: aiTranslation.enhanced,
      hasError: !!aiTranslation.error
    });

    const currentCache = getAITranslationCache();
    const beforeCount = Object.keys(currentCache).length;
    
    currentCache[word] = {
      ...aiTranslation,
      cachedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const cacheString = JSON.stringify(currentCache);
    localStorage.setItem(AI_CACHE_KEY, cacheString);
    
    const afterCount = Object.keys(currentCache).length;
    const cacheSizeKB = Math.round(cacheString.length / 1024 * 100) / 100;
    
    console.log('Successfully cached AI translation!', {
      word: word,
      beforeCount: beforeCount,
      afterCount: afterCount,
      isNewEntry: beforeCount < afterCount,
      totalCacheSizeKB: cacheSizeKB,
      timestamp: new Date().toLocaleTimeString()
    });
    
    if (cacheSizeKB > 1000) {
      console.warn('Cache size is getting large:', cacheSizeKB + 'KB');
    }
    
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Error updating AI cache for word:', word, errorMessage);
    
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded! Cache size too large.');
    }
  }
};

const getCachedAITranslation = (word: string): any | null => {
  try {
    console.log('Checking cache for word:', word);
    const cache = getAITranslationCache();
    const cached = cache[word];
    
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.cachedAt).getTime();
      const ageHours = Math.round(cacheAge / (1000 * 60 * 60) * 100) / 100;
      
      console.log('Found cached AI translation!', {
        word: word,
        cachedAt: cached.cachedAt,
        ageHours: ageHours,
        hasAI: !!cached.ai,
        version: cached.version
      });
      
      return cached;
    } else {
      console.log('No cached translation found for:', word);
      return null;
    }
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Error reading cached AI translation for word:', word, errorMessage);
    return null;
  }
};

// Separate component for individual favorite items
const FavoriteItem: React.FC<{
  fav: any;
  index: number;
  audioPlaying: string | null;
  isListening: boolean;
  onPlayAudio: (text: string, voiceType?: string) => void;
  onStartSpeechRecognition: (text: string) => void;
  onRemoveFromFavorites: (word: string) => void;
}> = ({ fav, index, audioPlaying, isListening, onPlayAudio, onStartSpeechRecognition, onRemoveFromFavorites }) => {
  const [aiEnhancement, setAiEnhancement] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Check for cached AI translation on component mount
  useEffect(() => {
    const cached = getCachedAITranslation(fav.word);
    if (cached) {
      setAiEnhancement(cached);
    }
  }, [fav.word]);

  const loadAIAnalysis = async () => {
    console.log('Starting AI analysis for word:', fav.word);
    
    // Check cache first with detailed logging
    const cached = getCachedAITranslation(fav.word);
    if (cached) {
      console.log('Using cached data, skipping API call');
      setAiEnhancement(cached);
      return;
    }

    // If not cached, fetch from API
    console.log('No cache found, making API request to Google Gemini...');
    setLoadingAI(true);
    
    try {
      const enhanced = await enhanceTranslationWithAI(fav.word, fav.translation);
      
      console.log('Received AI enhancement response:', {
        word: fav.word,
        enhanced: enhanced?.enhanced,
        hasAI: !!enhanced?.ai,
        hasError: !!enhanced?.error
      });
      
      if (enhanced && enhanced.enhanced) {
        console.log('Attempting to cache successful AI enhancement...');
        // Cache the successful result
        updateAITranslationCache(fav.word, enhanced);
        setAiEnhancement(enhanced);
      } else {
        console.log('AI enhancement failed or incomplete, not caching');
        setAiEnhancement(enhanced);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('AI enhancement request failed:', errorMessage);
      setAiEnhancement({
        base: fav.translation,
        ai: null,
        enhanced: false,
        error: 'Enhancement failed: ' + errorMessage
      });
    } finally {
      setLoadingAI(false);
      console.log('AI analysis process completed for word:', fav.word);
    }
  };

  return (
    <div className="border rounded-xl p-6 hover:shadow-md transition-shadow">
      {/* Word Header - Only Browser TTS */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-2xl font-bold text-blue-600">{fav.word}</h3>
          
          {/* Only Browser TTS for words/phrases */}
          <button
            onClick={() => onPlayAudio(fav.word, 'default')}
            className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"
            disabled={audioPlaying === fav.word}
            title="Browser Voice"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onStartSpeechRecognition(fav.word)}
            className={`text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-50 ${isListening ? 'animate-pulse' : ''}`}
            disabled={isListening}
            title="Practice pronunciation"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => onRemoveFromFavorites(fav.word)}
          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
          title="Remove from favorites"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Basic Translation */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold text-blue-800 mb-2">Basic Translation</h4>
        <p className="text-gray-700 text-lg">{fav.translation}</p>
      </div>

      {/* AI Enhancement Button with Cache Status */}
      <div className="mb-4">
        <button
          onClick={loadAIAnalysis}
          disabled={loadingAI}
          className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
            aiEnhancement ? 
            'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white' :
            'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
          }`}
        >
          {loadingAI ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing with Google AI...
            </>
          ) : aiEnhancement ? (
            <>
              <Star className="w-4 h-4 mr-2 fill-current" />
              AI Enhanced (Cached)
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />
              Enhance with Google AI
            </>
          )}
        </button>
        
        {/* Cache info */}
        {aiEnhancement && aiEnhancement.cachedAt && (
          <p className="text-xs text-gray-500 mt-1">
            Cached {new Date(aiEnhancement.cachedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* AI-Enhanced Analysis */}
      {aiEnhancement?.ai && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-4">
          <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Google AI Analysis
            {aiEnhancement.cachedAt && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Cached
              </span>
            )}
          </h4>
          
          {/* Grammatical Information */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded p-3">
              <h5 className="font-medium text-blue-700 mb-2">Grammar</h5>
              <p><strong>Part of Speech:</strong> {aiEnhancement.ai.grammaticalInfo?.partOfSpeech || 'Unknown'}</p>
              {aiEnhancement.ai.grammaticalInfo?.case && (
                <p><strong>Case:</strong> {aiEnhancement.ai.grammaticalInfo.case}</p>
              )}
              {aiEnhancement.ai.grammaticalInfo?.number && (
                <p><strong>Number:</strong> {aiEnhancement.ai.grammaticalInfo.number}</p>
              )}
              {aiEnhancement.ai.grammaticalInfo?.wordType && (
                <p><strong>Word Type:</strong> {aiEnhancement.ai.grammaticalInfo.wordType}</p>
              )}
            </div>
            
            <div className="bg-white rounded p-3">
              <h5 className="font-medium text-blue-700 mb-2">Learning Info</h5>
              <p><strong>Difficulty:</strong> {aiEnhancement.ai.difficulty}</p>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${
                      star <= (aiEnhancement.ai.difficulty === 'beginner' ? 2 : 
                               aiEnhancement.ai.difficulty === 'intermediate' ? 3 : 4) 
                        ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              {aiEnhancement.ai.pronunciation && (
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Pronunciation:</strong> {aiEnhancement.ai.pronunciation}
                </p>
              )}
            </div>
          </div>

          {/* Etymology and Formation Rules - only show if we have real data */}
          {(aiEnhancement.ai.etymology || aiEnhancement.ai.formationRules) && (
            <div className="bg-white rounded p-3 mb-4">
              <h5 className="font-medium text-blue-700 mb-2">Etymology & Formation</h5>
              {aiEnhancement.ai.etymology && (
                <p className="text-sm text-gray-700 mb-2">{aiEnhancement.ai.etymology}</p>
              )}
              {aiEnhancement.ai.formationRules && (
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-sm text-blue-800 font-medium">Formation Rule:</p>
                  <p className="text-sm text-blue-700">{aiEnhancement.ai.formationRules}</p>
                </div>
              )}
            </div>
          )}

          {/* Examples - only show if we have real examples */}
          {aiEnhancement.ai.examples && aiEnhancement.ai.examples.length > 0 && (
            <div className="bg-white rounded p-3 mb-4">
              <h5 className="font-medium text-blue-700 mb-2">Usage Examples</h5>
              {aiEnhancement.ai.examples.map((example: any, idx: number) => (
                <div key={idx} className="mb-2 p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-800">{example.finnish}</p>
                      <p className="text-sm text-gray-600 italic">{example.english}</p>
                    </div>
                    {/* Browser TTS only for examples */}
                    <button
                      onClick={() => onPlayAudio(example.finnish, 'default')}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded"
                      title="Browser Voice"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Related Words - only show if we have data */}
          {aiEnhancement.ai.relatedWords && aiEnhancement.ai.relatedWords.length > 0 && (
            <div className="bg-white rounded p-3 mb-4">
              <h5 className="font-medium text-blue-700 mb-2">Related Words</h5>
              <div className="flex flex-wrap gap-2">
                {aiEnhancement.ai.relatedWords.map((related: string, idx: number) => (
                  <span 
                    key={idx} 
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm cursor-pointer hover:bg-blue-200"
                    onClick={() => onPlayAudio(related, 'default')}
                    title="Click to hear pronunciation"
                  >
                    {related}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Usage Notes - show if available and not placeholder */}
          {aiEnhancement.ai.usageNotes && 
           aiEnhancement.ai.usageNotes !== 'No usage notes available' && 
           aiEnhancement.ai.usageNotes !== 'Analysis temporarily unavailable' && (
            <div className="bg-white rounded p-3">
              <h5 className="font-medium text-blue-700 mb-2">Usage Notes</h5>
              <p className="text-sm text-gray-700">{aiEnhancement.ai.usageNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {aiEnhancement?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">AI Analysis failed: {aiEnhancement.error}</p>
        </div>
      )}

      {/* Word Formation Rules - Basic Finnish Grammar Analysis */}
      <div className="bg-green-50 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold text-green-800 mb-2">Word Formation & Rules</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-green-700">Base form:</span>
            <span className="text-gray-700">{fav.word}</span>
          </div>
          
          {/* Finnish case analysis */}
          {fav.word.endsWith('ssa') || fav.word.endsWith('ssä') ? (
            <div className="bg-white rounded p-3 border-l-4 border-green-500">
              <p className="font-medium text-green-700">Inessive Case (-ssa/-ssä)</p>
              <p className="text-sm text-gray-600">Indicates location "in" or "at"</p>
              <p className="text-sm text-gray-600">
                Rule: Add -ssa (back vowels) or -ssä (front vowels) to word stem
              </p>
            </div>
          ) : fav.word.endsWith('ä') || fav.word.endsWith('a') ? (
            <div className="bg-white rounded p-3 border-l-4 border-green-500">
              <p className="font-medium text-green-700">Partitive Case (-a/-ä)</p>
              <p className="text-sm text-gray-600">Indicates partial object or amount</p>
              <p className="text-sm text-gray-600">
                Rule: Add -a (back vowels) or -ä (front vowels) to word stem
              </p>
            </div>
          ) : fav.word.endsWith('t') ? (
            <div className="bg-white rounded p-3 border-l-4 border-green-500">
              <p className="font-medium text-green-700">Plural Nominative (-t)</p>
              <p className="text-sm text-gray-600">Indicates multiple subjects</p>
              <p className="text-sm text-gray-600">
                Rule: Add -t to word stem for plural subjects
              </p>
            </div>
          ) : fav.word.endsWith('lla') || fav.word.endsWith('llä') ? (
            <div className="bg-white rounded p-3 border-l-4 border-green-500">
              <p className="font-medium text-green-700">Adessive Case (-lla/-llä)</p>
              <p className="text-sm text-gray-600">Indicates location "on" or "at"</p>
              <p className="text-sm text-gray-600">
                Rule: Add -lla (back vowels) or -llä (front vowels) to word stem
              </p>
            </div>
          ) : (
            <div className="bg-white rounded p-3 border-l-4 border-green-500">
              <p className="font-medium text-green-700">Base Form (Nominative)</p>
              <p className="text-sm text-gray-600">This appears to be the dictionary form</p>
            </div>
          )}
        </div>
      </div>

      {/* Added Date */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        Added {fav.addedAt ? new Date(fav.addedAt).toLocaleDateString() : 'recently'}
      </div>
    </div>
  );
};

const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favorites,
  audioPlaying,
  isListening,
  onPlayAudio,
  onStartSpeechRecognition,
  onRemoveFromFavorites,
  onGoToTheory
}) => {
  // Cache statistics
  const [cacheStats, setCacheStats] = useState({ total: 0, enhanced: 0 });

  useEffect(() => {
    const cache = getAITranslationCache();
    const total = Object.keys(cache).length;
    const enhanced = favorites.filter(fav => cache[fav.word]).length;
    setCacheStats({ total, enhanced });
  }, [favorites]);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-red-600 mb-2">Your Favorite Words</h2>
          <p className="text-xl text-gray-600">Saved vocabulary with detailed analysis</p>
          {cacheStats.total > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {cacheStats.enhanced}/{favorites.length} words have AI enhancements cached
            </p>
          )}
        </div>
        <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
          <Heart className="w-8 h-8 text-red-600" />
        </div>
      </div>
      
      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-500 mb-4">No favorites yet</h3>
          <p className="text-gray-400 mb-6">
            Click on words in lessons or use the heart button to save them here!
          </p>
          <button
            onClick={onGoToTheory}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Start Learning
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {favorites.map((fav, index) => (
            <FavoriteItem
              key={`${fav.word}-${index}`}
              fav={fav}
              index={index}
              audioPlaying={audioPlaying}
              isListening={isListening}
              onPlayAudio={onPlayAudio}
              onStartSpeechRecognition={onStartSpeechRecognition}
              onRemoveFromFavorites={onRemoveFromFavorites}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesSection;
