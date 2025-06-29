import React, { useState, useEffect } from 'react';
import { Heart, Volume2, Mic, X, Star } from 'lucide-react';
import { FavoritesSectionProps } from '../types';
import { enhanceTranslationWithAI } from '../utils/geminiAI';

const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favorites,
  vocabularyData,
  audioPlaying,
  isListening,
  onPlayAudio,
  onStartSpeechRecognition,
  onRemoveFromFavorites,
  onGoToTheory
}) => {
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
      
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Error updating AI cache for word:', word, errorMessage);
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
  }> = ({ fav, index }) => {
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

    const vocabularyEntry = vocabularyData.vocabulary[fav.word];

    return (
      <div className="border rounded-xl p-6 hover:shadow-md transition-shadow">
        {/* Word Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-2xl font-bold text-blue-600">{fav.word}</h3>
            
            {/* Audio button with smart TTS selection */}
            <button
              onClick={() => onPlayAudio(fav.word, 'standard')}
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

        {/* Enhanced Vocabulary Info */}
        {vocabularyEntry && (
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold text-green-800 mb-2">📚 Vocabulary Details</h4>
            
            <div className="space-y-2">
              <p className="text-gray-700"><strong>Grammar:</strong> {vocabularyEntry.grammarInfo}</p>
              {vocabularyEntry.pronunciation && (
                <p className="text-gray-700"><strong>Pronunciation:</strong> {vocabularyEntry.pronunciation}</p>
              )}
              {vocabularyEntry.examples && vocabularyEntry.examples.length > 0 && (
                <div>
                  <p className="font-medium text-green-700 mb-1">Examples:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {vocabularyEntry.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mt-3">
                {vocabularyEntry.sourceChapter && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    📚 Ch. {vocabularyEntry.sourceChapter}
                  </span>
                )}
                {vocabularyEntry.frequency && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    vocabularyEntry.frequency === 'high' ? 'bg-green-100 text-green-800' :
                    vocabularyEntry.frequency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    📊 {vocabularyEntry.frequency}
                  </span>
                )}
                {vocabularyEntry.difficulty && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    🎯 {vocabularyEntry.difficulty}
                  </span>
                )}
              </div>
              
              {/* Tags */}
              {vocabularyEntry.tags && vocabularyEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {vocabularyEntry.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Enhancement Button */}
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
            
            {/* Grammar and Learning Info */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded p-3">
                <h5 className="font-medium text-blue-700 mb-2">Grammar</h5>
                <p><strong>Part of Speech:</strong> {aiEnhancement.ai.grammaticalInfo?.partOfSpeech || 'Unknown'}</p>
                {aiEnhancement.ai.grammaticalInfo?.case && (
                  <p><strong>Case:</strong> {aiEnhancement.ai.grammaticalInfo.case}</p>
                )}
              </div>
              
              <div className="bg-white rounded p-3">
                <h5 className="font-medium text-blue-700 mb-2">Learning Info</h5>
                <p><strong>Difficulty:</strong> {aiEnhancement.ai.difficulty}</p>
                {aiEnhancement.ai.pronunciation && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Pronunciation:</strong> {aiEnhancement.ai.pronunciation}
                  </p>
                )}
              </div>
            </div>

            {/* Examples */}
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
                      <button
                        onClick={() => onPlayAudio(example.finnish, 'standard')}
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

            {/* Usage Notes */}
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

        {/* Added Date */}
        <div className="mt-4 text-sm text-gray-500 text-right">
          Added {fav.addedAt ? new Date(fav.addedAt).toLocaleDateString() : 'recently'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-red-600 mb-2">Your Favorite Words</h2>
          <p className="text-xl text-gray-600">Saved vocabulary with detailed analysis</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesSection;