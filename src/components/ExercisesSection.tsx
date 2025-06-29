import React from 'react';
import { CheckCircle, RotateCcw, Trophy } from 'lucide-react';
import { ExercisesSectionProps, ExerciseTypeIcons, ExerciseTypeLabels } from '../types';
import { renderExercise } from '../utils/exerciseHelpers';

const ExercisesSection: React.FC<ExercisesSectionProps> = ({
  lesson,
  audioScriptsData,
  exercisesCompleted,
  totalExercises,
  isAllCompleted,
  exerciseAnswers,
  exerciseSubmitted,
  audioPlaying,
  isListening,
  onAnswerChange,
  onBlankAnswerChange,
  onPlayAudio,
  onStartSpeechRecognition,
  onSubmitExercises,
  onResetExercises,
  onCompleteExercises,
  onRestartExercises
}) => {
  if (!lesson?.exercises || lesson.exercises.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <p className="text-center text-gray-500">No exercises available for this lesson.</p>
      </div>
    );
  }

  // Helper function to get exercise type summary
  const getExerciseTypesSummary = () => {
    const types = lesson.exercises.map((ex: any) => ExerciseTypeIcons[ex.type as keyof typeof ExerciseTypeIcons] || '📝');
    return Array.from(new Set(types)).join(' ');
  };

  // Helper function to get exercise type counts
  const getExerciseTypeCounts = () => {
    const counts: { [key: string]: number } = {};
    lesson.exercises.forEach((ex: any) => {
      const type = ex.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  };

  const typeCounts = getExerciseTypeCounts();

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      {/* Header with completion status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 mb-2">Practice Exercises</h2>
          <p className="text-xl text-gray-600">{lesson.title} - {lesson.subtitle}</p>
          {isAllCompleted && (
            <div className="flex items-center mt-2 text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">All Exercises Completed!</span>
            </div>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {exercisesCompleted}/{totalExercises}
          </div>
          <p className="text-sm text-gray-600">exercises completed</p>
          <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${totalExercises > 0 ? (exercisesCompleted / totalExercises) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Exercise Types Overview */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Exercise Types in this Lesson</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(typeCounts).map(([type, count]) => {
            const icon = ExerciseTypeIcons[type as keyof typeof ExerciseTypeIcons] || '📝';
            const label = ExerciseTypeLabels[type as keyof typeof ExerciseTypeLabels] || type;
            
            return (
              <div key={type} className="flex items-center space-x-2 bg-white rounded-lg p-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <div className="font-medium text-gray-800">{label}</div>
                  <div className="text-sm text-gray-600">{count} exercise{count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-center">
          <span className="text-sm text-gray-600">
            Total: {getExerciseTypesSummary()} ({lesson.exercises.length} exercises)
          </span>
        </div>
      </div>
      
      {/* Exercises */}
      <div className="space-y-8">
        {lesson.exercises.map((exercise: any, exerciseIndex: number) => {
          const icon = ExerciseTypeIcons[exercise.type as keyof typeof ExerciseTypeIcons] || '📝';
          const label = ExerciseTypeLabels[exercise.type as keyof typeof ExerciseTypeLabels] || exercise.type;
          
          return (
            <div key={exerciseIndex} className="border rounded-xl p-6 bg-gray-50">
              {/* Exercise Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {exerciseIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">{icon}</span>
                      {exercise.title}
                    </h3>
                    <p className="text-sm text-gray-600">{label}</p>
                  </div>
                </div>
                
                {/* Exercise status */}
                <div className="text-right">
                  {exercise.status && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      {exercise.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Exercise Instructions */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="font-medium text-gray-800 mb-2">📋 Instructions:</p>
                <p className="text-gray-700">{exercise.instruction}</p>
                {exercise.scenario && (
                  <p className="text-sm text-gray-600 mt-2 italic">Scenario: {exercise.scenario}</p>
                )}
              </div>

              {/* Exercise Content */}
              <div className="bg-white rounded-lg p-4">
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

              {/* Exercise Metadata */}
              {exercise.original_exercise && (
                <div className="mt-3 text-xs text-gray-500">
                  Original source: {exercise.original_exercise}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8 pt-6 border-t border-gray-200">
        {!isAllCompleted ? (
          <>
            {!exerciseSubmitted ? (
              <button
                onClick={onSubmitExercises}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center transition-colors"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Check Answers
              </button>
            ) : (
              <div className="flex space-x-4">
                <button
                  onClick={onResetExercises}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Try Again
                </button>
                <button
                  onClick={onCompleteExercises}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center transition-colors"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete All Exercises
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">All Exercises Completed!</h3>
            <p className="text-green-700 mb-4">Outstanding work! You've mastered this lesson.</p>
            <button
              onClick={onRestartExercises}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center mx-auto transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Practice Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExercisesSection;