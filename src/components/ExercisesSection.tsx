import React from 'react';
import { renderExercise, ExerciseProps } from '../utils/exerciseHelpers';

interface ExercisesSectionProps {
  currentTopic: any;
  exerciseAnswers: {[key: string]: any};
  exerciseSubmitted: boolean;
  audioPlaying: string | null;
  isListening: boolean;
  onAnswerChange: (exerciseIndex: number, itemIndex: number, answer: any) => void;
  onBlankAnswerChange: (exerciseIndex: number, itemIndex: number, blankIndex: number, answer: string) => void;
  onPlayAudio: (text: string, voiceType?: string) => void;
  onStartSpeechRecognition: (text: string) => void;
  onSubmitExercises: () => void;
  onResetExercises: () => void;
}

const ExercisesSection: React.FC<ExercisesSectionProps> = ({
  currentTopic,
  exerciseAnswers,
  exerciseSubmitted,
  audioPlaying,
  isListening,
  onAnswerChange,
  onBlankAnswerChange,
  onPlayAudio,
  onStartSpeechRecognition,
  onSubmitExercises,
  onResetExercises
}) => {
  if (!currentTopic?.exercises) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <p className="text-center text-gray-500">No exercises available for this lesson.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold text-blue-600 mb-8">Exercises</h2>
      
      <div className="space-y-8">
        {currentTopic.exercises.map((exercise: any, exerciseIndex: number) => (
          <div key={exerciseIndex} className="border rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">{exercise.instruction}</h3>
            {renderExercise({
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
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-4 mt-8">
        {!exerciseSubmitted ? (
          <button
            onClick={onSubmitExercises}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Check Answers
          </button>
        ) : (
          <button
            onClick={onResetExercises}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ExercisesSection;
