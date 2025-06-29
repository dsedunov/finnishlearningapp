import React from 'react';
import { Volume2, Mic, Heart, Play, Pause, CheckCircle, RotateCcw, Zap } from 'lucide-react';
import { TheorySectionProps } from '../types';

const TheorySection: React.FC<TheorySectionProps> = ({
  lesson,
  vocabularyData,
  audioScriptsData,
  isCompleted,
  audioPlaying,
  isListening,
  onPlayAudio,
  onStartSpeechRecognition,
  onAddToFavorites,
  onCompleteTheory,
  onRestartTheory,
  isFavorited,
  renderClickableText
}) => {
  if (!lesson?.theory) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <p className="text-center text-gray-500">No theory content available for this lesson.</p>
      </div>
    );
  }

  // Helper function to determine audio type based on text length
  const shouldUseEnhancedTTS = (text: string): boolean => {
    const wordCount = text.trim().split(/\s+/).length;
    return wordCount > 6;
  };

  // Helper function to get audio icon
  const getAudioIcon = (text: string) => {
    return shouldUseEnhancedTTS(text) ? <Zap className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />;
  };

  // Helper function to get audio voice type
  const getAudioVoiceType = (text: string): 'enhanced' | 'standard' => {
    return shouldUseEnhancedTTS(text) ? 'enhanced' : 'standard';
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      {/* Header with completion status */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 mb-2">{lesson.title}</h2>
          <p className="text-xl text-gray-600">{lesson.subtitle}</p>
          {isCompleted && (
            <div className="flex items-center mt-2 text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Theory Completed!</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {/* Audio for lesson title */}
          <button
            onClick={() => onPlayAudio(lesson.title, getAudioVoiceType(lesson.title))}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors"
            disabled={audioPlaying === lesson.title}
            title={shouldUseEnhancedTTS(lesson.title) ? "Enhanced AI Voice" : "Browser Voice"}
          >
            {audioPlaying === lesson.title ? <Pause className="w-6 h-6" /> : getAudioIcon(lesson.title)}
          </button>
          <button
            onClick={() => onStartSpeechRecognition(lesson.title)}
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
      
      {/* Theory Sections */}
      {lesson.theory.sections.map((section, index) => (
        <div key={index} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">{section.title}</h3>
              <p className="text-lg text-gray-600">{section.subtitle}</p>
            </div>
            {/* Audio for section title */}
            <button
              onClick={() => onPlayAudio(section.title, getAudioVoiceType(section.title))}
              className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
              disabled={audioPlaying === section.title}
              title={shouldUseEnhancedTTS(section.title) ? "Enhanced AI Voice" : "Browser Voice"}
            >
              {getAudioIcon(section.title)}
            </button>
          </div>
          
          {/* Section Content */}
          {section.content && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed">
                    {renderClickableText(section.content)}
                  </p>
                </div>
                {/* Audio for content */}
                <button
                  onClick={() => onPlayAudio(section.content, getAudioVoiceType(section.content))}
                  className="ml-4 text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition-colors flex-shrink-0"
                  disabled={audioPlaying === section.content}
                  title={shouldUseEnhancedTTS(section.content) ? "Enhanced AI Voice" : "Browser Voice"}
                >
                  {getAudioIcon(section.content)}
                </button>
              </div>
            </div>
          )}

          {/* Vocabulary Section */}
          {section.vocabulary && (
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span>📚 Vocabulary</span>
              </h4>
              <div className="grid gap-4">
                {section.vocabulary.map((item: any, vocabIndex: number) => {
                  // Get enhanced vocabulary data if available
                  const enhancedVocab = vocabularyData.vocabulary[item.finnish];
                  
                  return (
                    <div key={vocabIndex} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-semibold text-blue-600">{item.finnish}</span>
                          
                          {/* Audio with smart TTS selection */}
                          <button
                            onClick={() => onPlayAudio(item.finnish, getAudioVoiceType(item.finnish))}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                            disabled={audioPlaying === item.finnish}
                            title={shouldUseEnhancedTTS(item.finnish) ? "Enhanced AI Voice" : "Browser Voice"}
                          >
                            {getAudioIcon(item.finnish)}
                          </button>
                          
                          <button
                            onClick={() => onStartSpeechRecognition(item.finnish)}
                            className={`text-green-500 hover:text-green-700 p-1 rounded transition-colors ${isListening ? 'animate-pulse' : ''}`}
                            disabled={isListening}
                            title="Practice pronunciation"
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                          
                          {/* Enhanced vocabulary info */}
                          {enhancedVocab && (
                            <div className="flex items-center space-x-1">
                              {/* Frequency indicator */}
                              <span className={`px-2 py-1 rounded text-xs ${
                                enhancedVocab.frequency === 'high' ? 'bg-green-100 text-green-800' :
                                enhancedVocab.frequency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {enhancedVocab.frequency}
                              </span>
                              {/* Source chapter */}
                              <span className="text-xs text-gray-500">
                                Ch. {enhancedVocab.sourceChapter}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onAddToFavorites(item.finnish, item.russian)}
                          className={`${isFavorited(item.finnish) ? 'text-red-600' : 'text-red-500 hover:text-red-700'} p-1 rounded transition-colors`}
                          title="Add to favorites"
                        >
                          <Heart className={`w-5 h-5 ${isFavorited(item.finnish) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{item.russian}</p>
                      <p className="text-sm text-gray-600">{item.usage}</p>
                      
                      {/* Enhanced vocabulary details */}
                      {enhancedVocab && (
                        <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-500">
                          <p className="text-xs text-gray-600">
                            <strong>Grammar:</strong> {enhancedVocab.grammarInfo}
                          </p>
                          {enhancedVocab.pronunciation && (
                            <p className="text-xs text-gray-600">
                              <strong>Pronunciation:</strong> {enhancedVocab.pronunciation}
                            </p>
                          )}
                          {enhancedVocab.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {enhancedVocab.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Formality indicator */}
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
                  );
                })}
              </div>
            </div>
          )}

          {/* Grammar Section */}
          {section.grammar && (
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span>📝 Grammar Rules</span>
              </h4>
              <div className="grid gap-4">
                {section.grammar.map((rule: any, grammarIndex: number) => (
                  <div key={grammarIndex} className="bg-yellow-50 rounded-xl p-4 border-l-4 border-yellow-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-lg font-semibold text-yellow-800 mb-2">{rule.rule}</h5>
                        <p className="text-gray-700 mb-3">{rule.explanation}</p>
                        {rule.examples && rule.examples.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-2">Examples:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {rule.examples.map((example: string, exampleIndex: number) => (
                                <li key={exampleIndex} className="flex items-center justify-between">
                                  <span>{example}</span>
                                  <button
                                    onClick={() => onPlayAudio(example, getAudioVoiceType(example))}
                                    className="ml-2 text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                    disabled={audioPlaying === example}
                                    title={shouldUseEnhancedTTS(example) ? "Enhanced AI Voice" : "Browser Voice"}
                                  >
                                    {getAudioIcon(example)}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Completion Actions */}
      <div className="flex justify-center space-x-4 mt-8 pt-6 border-t border-gray-200">
        {!isCompleted ? (
          <button
            onClick={onCompleteTheory}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center transition-colors"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Complete Theory
          </button>
        ) : (
          <div className="text-center">
            <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Theory Completed!</h3>
            <p className="text-green-700 mb-4">Great work! You can review or move to the next section.</p>
            <button
              onClick={onRestartTheory}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center mx-auto transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Review Theory
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TheorySection;