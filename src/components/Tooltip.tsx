import React, { forwardRef } from 'react';
import { X, Heart, Volume2, Mic, Zap } from 'lucide-react';
import { getEnhancedTranslation } from '../utils/geminiAI';

interface TooltipProps {
  show: boolean;
  selectedText: string;
  position: { x: number; y: number };
  translations: any;
  onClose: () => void;
  onAddToFavorites: (word: string, translation?: any) => void;
  onPlayAudio: (text: string, voiceType?: string) => void;
  onStartSpeechRecognition: (text: string) => void;
  onEnhanceTranslation: (word: string) => void;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(({
  show,
  selectedText,
  position,
  translations,
  onClose,
  onAddToFavorites,
  onPlayAudio,
  onStartSpeechRecognition,
  onEnhanceTranslation
}, ref) => {
  if (!show) return null;

  const translation = translations[selectedText];

  // Helper function to safely extract string from translation
  const getTranslationText = (translation: any): string => {
    if (typeof translation === 'string') {
      return translation;
    }
    if (translation && typeof translation === 'object') {
      // Extract the Russian translation from your vocabulary structure
      return translation.russian || translation.baseForm || 'Translation available';
    }
    return 'Translation not found. Click to enhance with AI!';
  };

  return (
    <div
      ref={ref}
      className="fixed bg-black text-white p-4 rounded-lg shadow-xl z-50 max-w-sm"
      style={{
        left: Math.min(position.x - 150, window.innerWidth - 300),
        top: Math.max(position.y - 10, 10),
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-lg">{selectedText}</span>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Enhanced translation content */}
      {translation?.enhanced ? (
        <div className="space-y-2">
          <div className="text-sm">
            <p className="font-semibold text-blue-300">Primary Translation:</p>
            <p>{getTranslationText(translation.enhanced.baseTranslation)}</p>
          </div>
          
          {translation.enhanced.alternativeTranslations?.length > 0 && (
            <div className="text-sm">
              <p className="font-semibold text-green-300">Alternatives:</p>
              <p>{Array.isArray(translation.enhanced.alternativeTranslations) 
                ? translation.enhanced.alternativeTranslations.join(', ') 
                : String(translation.enhanced.alternativeTranslations)}</p>
            </div>
          )}
          
          <div className="text-sm">
            <p className="font-semibold text-yellow-300">Grammar:</p>
            <p>{String(translation.enhanced.grammaticalInfo?.partOfSpeech || 'Unknown')}</p>
            {translation.enhanced.grammaticalInfo?.case && (
              <p>Case: {String(translation.enhanced.grammaticalInfo.case)}</p>
            )}
          </div>
          
          {translation.enhanced.frequency && (
            <div className="text-xs">
              <span className={`px-2 py-1 rounded ${
                translation.enhanced.frequency === 'common' ? 'bg-green-600' :
                translation.enhanced.frequency === 'uncommon' ? 'bg-yellow-600' : 'bg-red-600'
              }`}>
                {String(translation.enhanced.frequency)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm whitespace-pre-line mb-3 leading-relaxed">
          {/* Fixed: Use the helper function to safely extract translation text */}
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-blue-300">Translation: </span>
              <span>{getTranslationText(translation)}</span>
            </div>
            
            {/* Show additional vocabulary info if available */}
            {translation && typeof translation === 'object' && (
              <>
                {translation.grammarInfo && (
                  <div>
                    <span className="font-semibold text-yellow-300">Grammar: </span>
                    <span className="text-xs">{String(translation.grammarInfo)}</span>
                  </div>
                )}
                
                {translation.pronunciation && (
                  <div>
                    <span className="font-semibold text-green-300">Pronunciation: </span>
                    <span className="text-xs">{String(translation.pronunciation)}</span>
                  </div>
                )}
                
                {translation.examples && Array.isArray(translation.examples) && translation.examples.length > 0 && (
                  <div>
                    <span className="font-semibold text-purple-300">Example: </span>
                    <span className="text-xs italic">{String(translation.examples[0])}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => {
            onAddToFavorites(selectedText, getTranslationText(translation));
            onClose();
          }}
          className="text-red-400 hover:text-red-300 flex items-center transition-colors"
        >
          <Heart className="w-4 h-4 mr-1" />
          Favorite
        </button>
        <button
          onClick={() => onPlayAudio(selectedText, 'standard')}
          className="text-blue-400 hover:text-blue-300 flex items-center transition-colors"
        >
          <Volume2 className="w-4 h-4 mr-1" />
          Listen
        </button>
        <button
          onClick={() => onPlayAudio(selectedText, 'enhanced')}
          className="text-purple-400 hover:text-purple-300 flex items-center transition-colors"
        >
          <Zap className="w-4 h-4 mr-1" />
          AI Voice
        </button>
        <button
          onClick={() => onStartSpeechRecognition(selectedText)}
          className="text-green-400 hover:text-green-300 flex items-center transition-colors"
        >
          <Mic className="w-4 h-4 mr-1" />
          Practice
        </button>
      </div>
      
      {/* Enhanced translation button for unknown words */}
      {!translation?.enhanced && (
        <button
          onClick={() => onEnhanceTranslation(selectedText)}
          className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center"
        >
          <Zap className="w-3 h-3 mr-1" />
          Enhance with AI
        </button>
      )}
      
      <div className="text-xs text-gray-400 mt-2 text-center">
        Press ESC or click outside to close
      </div>
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

export default Tooltip;
