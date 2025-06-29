import React from 'react';
import { Volume2, Mic, Zap } from 'lucide-react';

export interface ExerciseProps {
  exercise: any;
  exerciseIndex: number;
  exerciseAnswers: {[key: string]: any};
  exerciseSubmitted: boolean;
  audioPlaying: string | null;
  isListening: boolean;
  onAnswerChange: (exerciseIndex: number, itemIndex: number, answer: any) => void;
  onBlankAnswerChange: (exerciseIndex: number, itemIndex: number, blankIndex: number, answer: string) => void;
  onPlayAudio: (text: string, voiceType?: string) => void;
  onStartSpeechRecognition: (text: string) => void;
}

export const renderExercise = ({
  exercise,
  exerciseIndex,
  exerciseAnswers,
  exerciseSubmitted,
  audioPlaying,
  isListening,
  onAnswerChange,
  onBlankAnswerChange,
  onPlayAudio,
  onStartSpeechRecognition
}: ExerciseProps) => {
  if (!exercise || !exercise.items || !Array.isArray(exercise.items)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">⚠️ Exercise data is not available or malformed</p>
      </div>
    );
  }

  if (exercise.type === 'pronunciation') {
    return (
      <div className="space-y-4">
        {exercise.items.map((item: any, itemIndex: number) => {
          if (!item || !item.text) {
            return (
              <div key={itemIndex} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">⚠️ Pronunciation exercise data is incomplete</p>
              </div>
            );
          }

          return (
            <div key={itemIndex} className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-blue-600 mb-2">{item.text}</p>
              <p className="text-gray-600 mb-2">{item.translation || 'No translation available'}</p>
              {item.phonetic && (
                <p className="text-sm text-gray-500 mb-4">[{item.phonetic}]</p>
              )}
              <div className="flex justify-center space-x-4">
                {/* Enhanced TTS for pronunciation exercises */}
                <button
                  onClick={() => onPlayAudio(item.text, 'gemini')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
                  disabled={audioPlaying === item.text}
                  title="Enhanced AI Voice for pronunciation"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  AI Voice
                </button>
                
                <button
                  onClick={() => onStartSpeechRecognition(item.text)}
                  className={`px-4 py-2 rounded-lg flex items-center text-white ${
                    isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
                  disabled={isListening}
                  title="Practice pronunciation"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {isListening ? 'Listening...' : 'Practice'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // For other exercise types, use browser TTS only
  if (exercise.type === 'fill-blank') {
    return (
      <div className="space-y-4">
        {exercise.items.map((item: any, itemIndex: number) => {
          if (!item || !item.blanks || !Array.isArray(item.blanks)) {
            return (
              <div key={itemIndex} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">⚠️ Fill-blank exercise data is incomplete</p>
              </div>
            );
          }

          return (
            <div key={itemIndex} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <p className="text-lg flex-1">{item.text || 'No question text available'}</p>
                {/* Browser TTS only for fill-blank */}
                <button
                  onClick={() => onPlayAudio(item.text, 'default')}
                  className="text-blue-500 hover:text-blue-700 p-1 rounded"
                  disabled={audioPlaying === item.text}
                  title="Browser Voice"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {item.blanks.map((blank: string, blankIndex: number) => (
                  <input
                    key={blankIndex}
                    type="text"
                    className="border rounded px-3 py-1 text-center w-24"
                    placeholder={`${blankIndex + 1}`}
                    onChange={(e) => onBlankAnswerChange(exerciseIndex, itemIndex, blankIndex, e.target.value)}
                  />
                ))}
              </div>
              {exerciseSubmitted && (
                <div className="mt-3 p-3 bg-green-100 rounded">
                  <p className="text-green-800">✓ Correct answers: {item.blanks.join(', ')}</p>
                  {item.explanation && (
                    <p className="text-sm text-gray-600 mt-2">{item.explanation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (exercise.type === 'multiple-choice') {
    return (
      <div className="space-y-4">
        {exercise.items.map((item: any, itemIndex: number) => {
          if (!item || !item.options || !Array.isArray(item.options)) {
            return (
              <div key={itemIndex} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">⚠️ Multiple-choice exercise data is incomplete</p>
              </div>
            );
          }

          return (
            <div key={itemIndex} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <p className="font-semibold flex-1">{item.question || 'No question available'}</p>
                {/* Browser TTS only for multiple-choice */}
                <button
                  onClick={() => onPlayAudio(item.question, 'default')}
                  className="text-blue-500 hover:text-blue-700 p-1 rounded"
                  disabled={audioPlaying === item.question}
                  title="Browser Voice"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {item.options.map((option: string, optionIndex: number) => (
                  <label key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`exercise-${exerciseIndex}-${itemIndex}`}
                      value={optionIndex}
                      onChange={(e) => onAnswerChange(exerciseIndex, itemIndex, parseInt(e.target.value))}
                    />
                    <span>{option || 'Option not available'}</span>
                  </label>
                ))}
              </div>
              {exerciseSubmitted && (
                <div className="mt-3 p-3 bg-green-100 rounded">
                  <p className="text-green-800">
                    ✓ Correct answer: {item.options[item.correct] || 'Answer not available'}
                  </p>
                  {item.explanation && (
                    <p className="text-sm text-gray-600 mt-2">{item.explanation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-800">⚠️ Unknown exercise type: {exercise.type || 'undefined'}</p>
    </div>
  );
};
