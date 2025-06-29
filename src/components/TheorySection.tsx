import React from 'react';
import { Volume2, Mic, Heart, Play, Pause } from 'lucide-react';

interface TheorySectionProps {
  currentTopic: any;
  audioPlaying: string | null;
  isListening: boolean;
  onPlayAudio: (text: string, voiceType?: string) => void;
  onStartSpeechRecognition: (text: string) => void;
  onAddToFavorites: (word: string, translation: any) => void;
  isFavorited: (word: string) => boolean;
  renderClickableText: (text: string) => React.ReactNode;
}

const TheorySection: React.FC<TheorySectionProps> = ({
  currentTopic,
  audioPlaying,
  isListening,
  onPlayAudio,
  onStartSpeechRecognition,
  onAddToFavorites,
  isFavorited,
  renderClickableText
}) => {
  if (!currentTopic?.theory) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <p className="text-center text-gray-500">No theory content available for this lesson.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 mb-2">{currentTopic.title}</h2>
          <p className="text-xl text-gray-600">{currentTopic.subtitle}</p>
        </div>
        <div className="flex space-x-2">
          {/* Only browser TTS for theory section */}
          <button
            onClick={() => onPlayAudio(currentTopic.title, 'default')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full"
            disabled={audioPlaying === currentTopic.title}
            title="Browser Voice"
          >
            {audioPlaying === currentTopic.title ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button
            onClick={() => onStartSpeechRecognition(currentTopic.title)}
            className={`p-3 rounded-full transition-colors ${
              isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white`}
            disabled={isListening}
            title="Practice pronunciation"
          >
            <Mic className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {currentTopic.theory.sections.map((section: any, index: number) => (
        <div key={index} className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">{section.title}</h3>
          <p className="text-lg text-gray-600 mb-4">{section.subtitle}</p>
          
          {section.content && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <p className="text-gray-700 leading-relaxed">
                {renderClickableText(section.content)}
              </p>
            </div>
          )}

          {section.vocabulary && (
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-4">Vocabulary</h4>
              <div className="grid gap-4">
                {section.vocabulary.map((item: any, vocabIndex: number) => (
                  <div key={vocabIndex} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-semibold text-blue-600">{item.finnish}</span>
                        
                        {/* Only browser TTS for vocabulary */}
                        <button
                          onClick={() => onPlayAudio(item.finnish, 'default')}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded"
                          disabled={audioPlaying === item.finnish}
                          title="Browser Voice"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onStartSpeechRecognition(item.finnish)}
                          className={`text-green-500 hover:text-green-700 p-1 rounded ${isListening ? 'animate-pulse' : ''}`}
                          disabled={isListening}
                          title="Practice pronunciation"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => onAddToFavorites(item.finnish, item.russian)}
                        className={`${isFavorited(item.finnish) ? 'text-red-600' : 'text-red-500 hover:text-red-700'} p-1 rounded`}
                        title="Add to favorites"
                      >
                        <Heart className={`w-5 h-5 ${isFavorited(item.finnish) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <p className="text-gray-700 mb-2">{item.russian}</p>
                    <p className="text-sm text-gray-600">{item.usage}</p>
                    {item.formality && (
                      <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                        item.formality === 'formal' ? 'bg-blue-100 text-blue-800' : 
                        item.formality === 'informal' ? 'bg-green-100 text-green-800' : 
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.formality === 'formal' ? 'FORMAL' : 
                         item.formality === 'informal' ? 'CASUAL' : 'VERY CASUAL'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.grammar && (
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-4">Grammar</h4>
              <div className="grid gap-4">
                {section.grammar.map((rule: any, grammarIndex: number) => (
                  <div key={grammarIndex} className="bg-yellow-50 rounded-xl p-4">
                    <h5 className="text-lg font-semibold text-yellow-800 mb-2">{rule.rule}</h5>
                    <p className="text-gray-700 mb-3">{rule.explanation}</p>
                    {rule.examples && rule.examples.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-2">Examples:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {rule.examples.map((example: string, exampleIndex: number) => (
                            <li key={exampleIndex}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TheorySection;
