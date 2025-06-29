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
  onPlayAudio: (text: string, voiceType?: 'enhanced' | 'standard') => void;
  onStartSpeechRecognition: (text: string) => void;
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
    // Handle exercises with questions instead of items
    if (exercise.questions && Array.isArray(exercise.questions)) {
      return renderQuestionsExercise({
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
      });
    }
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">⚠️ Exercise data is not available or malformed</p>
        <p className="text-sm text-yellow-600 mt-1">Type: {exercise.type || 'unknown'}</p>
      </div>
    );
  }

  // Handle different exercise types
  switch (exercise.type) {
    case 'pronunciation_drill':
      return renderPronunciationExercise({
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
      });

    case 'listening_exercise':
    case 'listening_comprehension':
    case 'listening_repurposed':
      return renderListeningExercise({
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
      });

    case 'grammar_fill':
    case 'written_task':
      return renderWrittenExercise({
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
      });

    case 'dialogue_complete':
      return renderDialogueExercise({
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
      });

    default:
      return renderGenericExercise({
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
      });
  }
};

// Pronunciation exercises - use enhanced TTS
const renderPronunciationExercise = ({
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
          <div key={itemIndex} className="bg-purple-50 rounded-lg p-6 text-center border-l-4 border-purple-500">
            <p className="text-2xl font-bold text-purple-800 mb-2">{item.text}</p>
            <p className="text-gray-600 mb-2">{item.translation || 'Practice pronunciation'}</p>
            {item.phonetic && (
              <p className="text-sm text-gray-500 mb-4">[{item.phonetic}]</p>
            )}
            <div className="flex justify-center space-x-4">
              {/* Always use enhanced TTS for pronunciation exercises */}
              <button
                onClick={() => onPlayAudio(item.text, 'enhanced')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
                disabled={audioPlaying === item.text}
                title="Enhanced AI Voice for pronunciation"
              >
                <Zap className="w-4 h-4 mr-2" />
                Enhanced Audio
              </button>
              
              <button
                onClick={() => onStartSpeechRecognition(item.text)}
                className={`px-6 py-3 rounded-lg flex items-center text-white transition-colors ${
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
};

// Listening exercises - enhanced TTS for longer content
const renderListeningExercise = ({
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
  // Handle exercises with questions array
  if (exercise.questions) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <p className="text-blue-800 font-medium">🎧 Listen and answer the questions below:</p>
          {exercise.script_id && (
            <p className="text-sm text-blue-600 mt-1">Audio script: {exercise.script_id}</p>
          )}
        </div>
        
        {exercise.questions.map((question: any, questionIndex: number) => (
          <div key={questionIndex} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold flex-1">{question.question}</p>
              <button
                onClick={() => onPlayAudio(question.question, getAudioVoiceType(question.question))}
                className="ml-2 text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                disabled={audioPlaying === question.question}
                title={shouldUseEnhancedTTS(question.question) ? "Enhanced AI Voice" : "Browser Voice"}
              >
                {getAudioIcon(question.question)}
              </button>
            </div>
            
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Your answer..."
              onChange={(e) => onAnswerChange(exerciseIndex, questionIndex, e.target.value)}
            />
            
            {exerciseSubmitted && question.answer && (
              <div className="mt-3 p-3 bg-green-100 rounded">
                <p className="text-green-800 font-semibold">✓ Correct answer: {question.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Handle exercises with items array
  return (
    <div className="space-y-4">
      {exercise.items.map((item: any, itemIndex: number) => {
        if (!item) {
          return (
            <div key={itemIndex} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">⚠️ Listening exercise data is incomplete</p>
            </div>
          );
        }

        return (
          <div key={itemIndex} className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <p className="text-lg flex-1">{item.question || item.text || 'Listen and respond'}</p>
              {(item.question || item.text) && (
                <button
                  onClick={() => onPlayAudio(item.question || item.text, 'enhanced')}
                  className="text-purple-500 hover:text-purple-700 p-2 rounded transition-colors"
                  disabled={audioPlaying === (item.question || item.text)}
                  title="Enhanced AI Voice for listening"
                >
                  <Zap className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {item.options ? (
              // Multiple choice
              <div className="space-y-2">
                {item.options.map((option: string, optionIndex: number) => (
                  <label key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`exercise-${exerciseIndex}-${itemIndex}`}
                      value={optionIndex}
                      onChange={(e) => onAnswerChange(exerciseIndex, itemIndex, parseInt(e.target.value))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              // Text input
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Your answer..."
                onChange={(e) => onAnswerChange(exerciseIndex, itemIndex, e.target.value)}
              />
            )}
            
            {exerciseSubmitted && (item.correct !== undefined || item.answer) && (
              <div className="mt-3 p-3 bg-green-100 rounded">
                <p className="text-green-800 font-semibold">
                  ✓ Correct answer: {
                    item.options ? item.options[item.correct] : item.answer
                  }
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Written exercises - standard TTS
const renderWrittenExercise = ({
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
  return (
    <div className="space-y-4">
      {exercise.items.map((item: any, itemIndex: number) => {
        if (!item) {
          return (
            <div key={itemIndex} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">⚠️ Written exercise data is incomplete</p>
            </div>
          );
        }

        return (
          <div key={itemIndex} className="bg-gray-50 rounded-lg p-4">
            {/* Fill in the blanks */}
            {item.blanks ? (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <p className="text-lg flex-1">{item.sentence || item.prompt || 'Complete the sentence'}</p>
                  {(item.sentence || item.prompt) && (
                    <button
                      onClick={() => onPlayAudio(item.sentence || item.prompt, getAudioVoiceType(item.sentence || item.prompt))}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                      disabled={audioPlaying === (item.sentence || item.prompt)}
                      title={shouldUseEnhancedTTS(item.sentence || item.prompt) ? "Enhanced AI Voice" : "Browser Voice"}
                    >
                      {getAudioIcon(item.sentence || item.prompt)}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.blanks.map((blank: string, blankIndex: number) => (
                    <input
                      key={blankIndex}
                      type="text"
                      className="border rounded px-3 py-1 text-center w-32"
                      placeholder={`${blankIndex + 1}`}
                      onChange={(e) => onBlankAnswerChange(exerciseIndex, itemIndex, blankIndex, e.target.value)}
                    />
                  ))}
                </div>
                {exerciseSubmitted && (
                  <div className="mt-3 p-3 bg-green-100 rounded">
                    <p className="text-green-800 font-semibold">✓ Correct answers: {item.blanks.join(', ')}</p>
                    {item.explanation && (
                      <p className="text-sm text-gray-600 mt-2">{item.explanation}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              // Simple prompt/answer
              <>
                <div className="flex items-center space-x-2 mb-3">
                  <p className="font-semibold flex-1">{item.prompt || item.question || 'Question not available'}</p>
                  {(item.prompt || item.question) && (
                    <button
                      onClick={() => onPlayAudio(item.prompt || item.question, getAudioVoiceType(item.prompt || item.question))}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                      disabled={audioPlaying === (item.prompt || item.question)}
                      title={shouldUseEnhancedTTS(item.prompt || item.question) ? "Enhanced AI Voice" : "Browser Voice"}
                    >
                      {getAudioIcon(item.prompt || item.question)}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Your answer..."
                  onChange={(e) => onAnswerChange(exerciseIndex, itemIndex, e.target.value)}
                />
                {exerciseSubmitted && item.answer && (
                  <div className="mt-3 p-3 bg-green-100 rounded">
                    <p className="text-green-800 font-semibold">✓ Correct answer: {item.answer}</p>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Dialogue completion exercises
const renderDialogueExercise = ({
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
  return (
    <div className="space-y-4">
      {exercise.items.map((item: any, itemIndex: number) => {
        if (!item || !item.missing_parts) {
          return (
            <div key={itemIndex} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">⚠️ Dialogue exercise data is incomplete</p>
            </div>
          );
        }

        return (
          <div key={itemIndex} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
            <h4 className="font-semibold text-green-800 mb-3">💬 Complete the dialogue:</h4>
            
            <div className="space-y-3">
              {item.missing_parts.map((part: any, partIndex: number) => (
                <div key={partIndex} className="bg-white rounded p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <strong>{part.speaker}:</strong>
                    <button
                      onClick={() => onPlayAudio(part.text, getAudioVoiceType(part.text))}
                      className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                      disabled={audioPlaying === part.text}
                      title={shouldUseEnhancedTTS(part.text) ? "Enhanced AI Voice" : "Browser Voice"}
                    >
                      {getAudioIcon(part.text)}
                    </button>
                  </div>
                  
                  {part.text.includes('__') ? (
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      placeholder="Fill in the missing words..."
                      onChange={(e) => onAnswerChange(exerciseIndex, itemIndex, e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-700">{part.text}</p>
                  )}
                </div>
              ))}
            </div>

            {item.options && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm font-medium text-blue-800 mb-2">Suggested phrases:</p>
                <div className="flex flex-wrap gap-2">
                  {item.options.map((option: string, optionIndex: number) => (
                    <button
                      key={optionIndex}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm transition-colors"
                      onClick={() => {
                        // This would typically fill in the current input
                        console.log('Selected option:', option);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {exerciseSubmitted && item.correct && (
              <div className="mt-3 p-3 bg-green-100 rounded">
                <p className="text-green-800 font-semibold">✓ Correct answers:</p>
                {Array.isArray(item.correct) ? (
                  <ul className="list-disc list-inside text-sm text-green-700 mt-1">
                    {item.correct.map((answer: string, answerIndex: number) => (
                      <li key={answerIndex}>{answer}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-700">{item.correct}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Questions-based exercises (for listening_repurposed etc.)
const renderQuestionsExercise = ({
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
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <p className="text-blue-800 font-medium">🎧 Listen and answer:</p>
        {exercise.script_id && (
          <p className="text-sm text-blue-600 mt-1">Audio reference: {exercise.script_id}</p>
        )}
      </div>
      
      {exercise.questions.map((question: any, questionIndex: number) => (
        <div key={questionIndex} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="font-semibold flex-1">{question.question}</p>
            <button
              onClick={() => onPlayAudio(question.question, getAudioVoiceType(question.question))}
              className="ml-2 text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
              disabled={audioPlaying === question.question}
              title={shouldUseEnhancedTTS(question.question) ? "Enhanced AI Voice" : "Browser Voice"}
            >
              {getAudioIcon(question.question)}
            </button>
          </div>
          
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Your answer..."
            onChange={(e) => onAnswerChange(exerciseIndex, questionIndex, e.target.value)}
          />
          
          {exerciseSubmitted && question.answer && (
            <div className="mt-3 p-3 bg-green-100 rounded">
              <p className="text-green-800 font-semibold">✓ Correct answer: {question.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Generic fallback for unknown exercise types
const renderGenericExercise = ({
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
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-800 font-medium">⚠️ Unknown exercise type: {exercise.type || 'undefined'}</p>
      <p className="text-sm text-yellow-600 mt-1">
        This exercise type is not yet supported. Please implement a renderer for "{exercise.type}".
      </p>
      {exercise.instruction && (
        <p className="text-sm text-gray-600 mt-2">Instructions: {exercise.instruction}</p>
      )}
    </div>
  );
};