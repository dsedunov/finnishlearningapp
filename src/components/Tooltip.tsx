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
            <p>{translation.enhanced.baseTranslation}</p>
          </div>
          
          {translation.enhanced.alternativeTranslations?.length > 0 && (
            <div className="text-sm">
              <p className="font-semibold text-green-300">Alternatives:</p>
              <p>{translation.enhanced.alternativeTranslations.join(', ')}</p>
            </div>
          )}
          
          <div className="text-sm">
            <p className="font-semibold text-yellow-300">Grammar:</p>
            <p>{translation.enhanced.grammaticalInfo.partOfSpeech}</p>
            {translation.enhanced.grammaticalInfo.case && (
              <p>Case: {translation.enhanced.grammaticalInfo.case}</p>
            )}
          </div>
          
          {translation.enhanced.frequency && (
            <div className="text-xs">
              <span className={`px-2 py-1 rounded ${
                translation.enhanced.frequency === 'common' ? 'bg-green-600' :
                translation.enhanced.frequency === 'uncommon' ? 'bg-yellow-600' : 'bg-red-600'
              }`}>
                {translation.enhanced.frequency}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm whitespace-pre-line mb-3 leading-relaxed">
          {translation?.base || translation || 'Translation not found. Click to enhance with AI!'}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => {
            onAddToFavorites(selectedText, translation?.base || translation);
            onClose();
          }}
          className="text-red-400 hover:text-red-300 flex items-center transition-colors"
        >
          <Heart className="w-4 h-4 mr-1" />
          Favorite
        </button>
        <button
          onClick={() => onPlayAudio(selectedText, 'default')}
          className="text-blue-400 hover:text-blue-300 flex items-center transition-colors"
        >
          <Volume2 className="w-4 h-4 mr-1" />
          Listen
        </button>
        <button
          onClick={() => onPlayAudio(selectedText, 'gemini')}
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
