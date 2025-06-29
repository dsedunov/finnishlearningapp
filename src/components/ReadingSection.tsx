import React from 'react';
import { Volume2, Mic, Zap, Trophy } from 'lucide-react';

interface ReadingSectionProps {
  currentTopic: any;
  audioPlaying: string | null;
  isListening: boolean;
  exerciseSubmitted: boolean;
  onPlayAudio: (text: string, voiceType?: string) => void;
  onStartSpeechRecognition: (text: string) => void;
  onSubmitReading: () => void;
  onResetReading: () => void;
  onGoToExercises: () => void;
  renderClickableText: (text: string) => React.ReactNode;
  ttsAvailable?: boolean; // Add prop to check TTS availability
}

const ReadingSection: React.FC<ReadingSectionProps> = ({
  currentTopic,
  audioPlaying,
  isListening,
  exerciseSubmitted,
  onPlayAudio,
  onStartSpeechRecognition,
  onSubmitReading,
  onResetReading,
  onGoToExercises,
  renderClickableText,
  ttsAvailable = true // Default to true, can be passed from parent
}) => {
  if (!currentTopic?.reading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <p className="text-center text-gray-500">No reading content available for this lesson.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold text-blue-600 mb-2">{currentTopic.reading.title}</h2>
      <p className="text-xl text-gray-600 mb-4">{currentTopic.reading.subtitle}</p>
      
      {currentTopic.reading.description && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-gray-700">{currentTopic.reading.description}</p>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {currentTopic.reading.dialogue.map((line: any, index: number) => {
          // Count words in the line
          const wordCount = line.text.trim().split(/\s+/).length;
          
          // Determine which audio icon to show based on rules
          const shouldUseEnhancedTTS = wordCount > 6 && ttsAvailable;
          
          return (
            <div key={index} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {line.speaker[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-semibold text-gray-800">{line.speaker}:</p>
                    
                    {/* Single audio icon based on conditions */}
                    {shouldUseEnhancedTTS ? (
                      <button
                        onClick={() => onPlayAudio(line.text, 'gemini')}
                        className="text-purple-500 hover:text-purple-700 p-1 rounded"
                        disabled={audioPlaying === line.text}
                        title="Enhanced AI Voice (6+ words)"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onPlayAudio(line.text, 'default')}
                        className="text-blue-500 hover:text-blue-700 p-1 rounded"
                        disabled={audioPlaying === line.text}
                        title="Browser Voice"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => onStartSpeechRecognition(line.text)}
                      className={`text-green-500 hover:text-green-700 p-1 rounded ${isListening ? 'animate-pulse' : ''}`}
                      disabled={isListening}
                      title="Practice pronunciation"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-lg mb-2">{renderClickableText(line.text)}</p>
                  <p className="text-sm text-gray-600 italic">{line.translation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentTopic.reading.questions && (
        <div className="bg-green-50 rounded-xl p-6 mb-8">
          <h4 className="text-xl font-semibold mb-4">Test your knowledge</h4>
          {currentTopic.reading.questions.map((question: any, index: number) => (
            <div key={index} className="mb-4">
              <p className="font-semibold text-gray-800 mb-1">{question.question}</p>
              <p className="text-sm text-gray-600 mb-2">{question.translation}</p>
              {exerciseSubmitted && (
                <div className="bg-green-100 rounded-lg p-3">
                  <p className="text-green-800 font-semibold">✓ {question.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        {!exerciseSubmitted ? (
          <button
            onClick={onSubmitReading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Complete Reading
          </button>
        ) : (
          <div className="text-center">
            <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Reading completed!</h3>
            <p className="text-green-700 mb-4">Great work! You can repeat or move to exercises.</p>
            <button
              onClick={onResetReading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg mr-4"
            >
              Repeat Reading
            </button>
            <button
              onClick={onGoToExercises}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Go to Exercises
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingSection;
