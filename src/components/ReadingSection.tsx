import React from 'react';
import { Volume2, Mic, Zap, Trophy, CheckCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { ReadingSectionProps } from '../types';

const ReadingSection: React.FC<ReadingSectionProps> = ({
  lesson,
  audioScriptsData,
  isCompleted,
  audioPlaying,
  isListening,
  isGeneratingAudio, // Make sure this prop is included
  onPlayAudio,
  onStartSpeechRecognition,
  onCompleteReading,
  onRestartReading,
  onGoToExercises,
  renderClickableText
}) => {
  if (!lesson?.reading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <p className="text-center text-gray-500">No reading content available for this lesson.</p>
      </div>
    );
  }

  // Helper function to determine audio type based on text length and preferences
  const shouldUseEnhancedTTS = (text: string): boolean => {
    const wordCount = text.trim().split(/\s+/).length;
    // Use enhanced TTS for longer texts or if specified in reading preferences
    return wordCount > 6 || lesson.reading.preferredTTS === 'enhanced';
  };

  // Helper function to get audio icon
  const getAudioIcon = (text: string) => {
    return shouldUseEnhancedTTS(text) ? <Zap className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />;
  };

  // Helper function to get audio voice type
  const getAudioVoiceType = (text: string): 'enhanced' | 'standard' => {
    return shouldUseEnhancedTTS(text) ? 'enhanced' : 'standard';
  };

  // Get dialogue script from audioScriptsData
  const getDialogueScript = () => {
    return audioScriptsData.scripts.find(script => script.id === lesson.reading.dialogue_id);
  };

  const dialogueScript = getDialogueScript();

  // Parse dialogue script if available, otherwise use fallback
  const parseDialogue = () => {
    if (dialogueScript) {
      // Parse dialogue script text into speakers and lines
      const lines = dialogueScript.text.split(/(?=[A-Z][a-z]+:)/);
      return lines.filter(line => line.trim()).map(line => {
        const [speaker, ...textParts] = line.split(':');
        return {
          speaker: speaker.trim(),
          text: textParts.join(':').trim(),
          translation: '', // Would need to be enhanced with translations
          emotion: 'neutral'
        };
      });
    }
    
    // Fallback to lesson data if available
    return lesson.reading.dialogue || [];
  };

  const dialogue = parseDialogue();

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      {/* Header with completion status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 mb-2">{lesson.reading.title}</h2>
          <p className="text-xl text-gray-600">{lesson.reading.subtitle}</p>
          {isCompleted && (
            <div className="flex items-center mt-2 text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Reading Completed!</span>
            </div>
          )}
        </div>
        
        {/* Audio quality indicator */}
        <div className="text-right">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            {lesson.reading.preferredTTS === 'enhanced' ? (
              <>
                <Zap className="w-4 h-4 text-purple-500" />
                <span>Enhanced Audio Quality</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-blue-500" />
                <span>Standard Audio Quality</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">⏱️ {lesson.estimatedMinutes} min reading</p>
        </div>
      </div>
      
      {/* Description */}
      {lesson.reading.description && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between">
            <p className="text-gray-700 flex-1">{lesson.reading.description}</p>
            <button
              onClick={() => onPlayAudio(lesson.reading.description, getAudioVoiceType(lesson.reading.description))}
              disabled={audioPlaying === lesson.reading.description || (isGeneratingAudio && shouldUseEnhancedTTS(lesson.reading.description))}
              className={`ml-4 p-2 rounded-full transition-colors flex-shrink-0 ${
                shouldUseEnhancedTTS(lesson.reading.description)
                  ? `text-purple-500 hover:text-purple-700 hover:bg-purple-100 ${
                      isGeneratingAudio ? 'opacity-50 cursor-not-allowed' : ''
                    }`
                  : 'text-blue-500 hover:text-blue-700 hover:bg-blue-100'
              }`}
              title={shouldUseEnhancedTTS(lesson.reading.description) ? 
                (isGeneratingAudio ? "Generating Enhanced Audio..." : "Enhanced AI Voice") : 
                "Browser Voice"
              }
            >
              {isGeneratingAudio && shouldUseEnhancedTTS(lesson.reading.description) ? (
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                getAudioIcon(lesson.reading.description)
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dialogue Section */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">📖 Dialogue</h3>
          
          {/* Play entire dialogue button */}
          {dialogueScript && (
            <button
              onClick={() => onPlayAudio(
                dialogueScript.text, 
                dialogueScript.preferredTTS === 'enhanced' ? 'enhanced' : 'standard'
              )}
              disabled={audioPlaying === dialogueScript.text || (isGeneratingAudio && dialogueScript.preferredTTS === 'enhanced')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                dialogueScript.preferredTTS === 'enhanced' 
                  ? `bg-purple-500 hover:bg-purple-600 text-white ${
                      isGeneratingAudio ? 'opacity-50 cursor-not-allowed' : ''
                    }`
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isGeneratingAudio && dialogueScript.preferredTTS === 'enhanced' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  {dialogueScript.preferredTTS === 'enhanced' ? (
                    <Zap className="w-4 h-4 mr-2" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2" />
                  )}
                  Play Full Dialogue
                </>
              )}
            </button>
          )}
        </div>

        {dialogue.map((line: any, index: number) => {
          // Determine if this line should use enhanced TTS
          const useEnhanced = shouldUseEnhancedTTS(line.text);
          
          return (
            <div key={index} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {line.speaker ? line.speaker[0] : '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-semibold text-gray-800">{line.speaker}:</p>
                    
                    {/* Audio button with smart TTS selection */}
                    <button
                      onClick={() => onPlayAudio(line.text, getAudioVoiceType(line.text))}
                      disabled={audioPlaying === line.text || (isGeneratingAudio && useEnhanced)}
                      className={`p-1 rounded transition-colors ${
                        useEnhanced 
                          ? `text-purple-500 hover:text-purple-700 ${
                              isGeneratingAudio ? 'opacity-50 cursor-not-allowed' : ''
                            }`
                          : 'text-blue-500 hover:text-blue-700'
                      }`}
                      title={useEnhanced ? 
                        (isGeneratingAudio ? "Generating Enhanced Audio..." : "Enhanced AI Voice (6+ words)") : 
                        "Browser Voice"
                      }
                    >
                      {isGeneratingAudio && useEnhanced ? (
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        getAudioIcon(line.text)
                      )}
                    </button>
                    
                    <button
                      onClick={() => onStartSpeechRecognition(line.text)}
                      className={`text-green-500 hover:text-green-700 p-1 rounded transition-colors ${isListening ? 'animate-pulse' : ''}`}
                      disabled={isListening}
                      title="Practice pronunciation"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Audio quality indicator */}
                    <span className="text-xs text-gray-500">
                      {useEnhanced ? (isGeneratingAudio ? '⚡ Generating...' : '⚡ Enhanced') : '🔊 Standard'}
                    </span>
                  </div>
                  
                  <p className="text-lg mb-2">{renderClickableText(line.text)}</p>
                  {line.translation && (
                    <p className="text-sm text-gray-600 italic">{line.translation}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reading Questions */}
      {lesson.reading.questions && (
        <div className="bg-green-50 rounded-xl p-6 mb-8">
          <h4 className="text-xl font-semibold mb-4 flex items-center">
            <span>❓ Comprehension Check</span>
          </h4>
          {lesson.reading.questions.map((question: any, index: number) => (
            <div key={index} className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-gray-800 flex-1">{question.question}</p>
                <button
                  onClick={() => onPlayAudio(question.question, getAudioVoiceType(question.question))}
                  disabled={audioPlaying === question.question || (isGeneratingAudio && shouldUseEnhancedTTS(question.question))}
                  className={`ml-2 p-1 rounded transition-colors ${
                    shouldUseEnhancedTTS(question.question)
                      ? `text-green-600 hover:text-green-800 ${
                          isGeneratingAudio ? 'opacity-50 cursor-not-allowed' : ''
                        }`
                      : 'text-green-600 hover:text-green-800'
                  }`}
                  title={shouldUseEnhancedTTS(question.question) ? 
                    (isGeneratingAudio ? "Generating Enhanced Audio..." : "Enhanced AI Voice") : 
                    "Browser Voice"
                  }
                >
                  {isGeneratingAudio && shouldUseEnhancedTTS(question.question) ? (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    getAudioIcon(question.question)
                  )}
                </button>
              </div>
              {question.translation && (
                <p className="text-sm text-gray-600 mb-2">{question.translation}</p>
              )}
              {isCompleted && (
                <div className="bg-green-100 rounded-lg p-3">
                  <p className="text-green-800 font-semibold">✓ {question.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audio Script Info */}
      {dialogueScript && (
        <div className="bg-purple-50 rounded-xl p-4 mb-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-purple-800">Audio Information</h4>
              <p className="text-sm text-purple-600">
                Type: {dialogueScript.type} | 
                Duration: ~{dialogueScript.estimatedDuration}s | 
                Quality: {dialogueScript.preferredTTS === 'enhanced' ? 'Enhanced AI' : 'Standard'}
              </p>
              {dialogueScript.note && (
                <p className="text-xs text-purple-600 mt-1">{dialogueScript.note}</p>
              )}
            </div>
            <div className="text-2xl">
              {dialogueScript.preferredTTS === 'enhanced' ? '⚡' : '🔊'}
            </div>
          </div>
        </div>
      )}

      {/* Completion Actions */}
      <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
        {!isCompleted ? (
          <button
            onClick={onCompleteReading}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center transition-colors"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Complete Reading
          </button>
        ) : (
          <div className="text-center">
            <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Reading Completed!</h3>
            <p className="text-green-700 mb-4">Excellent work! You can review or move to exercises.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={onRestartReading}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Review Reading
              </button>
              <button
                onClick={onGoToExercises}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
              >
                Go to Exercises
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingSection;
