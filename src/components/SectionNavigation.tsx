import React from 'react';
import { Home, ChevronLeft, BookOpen, Glasses, Puzzle } from 'lucide-react';
import { SectionNavigationProps, ExerciseTypeIcons } from '../types';

const SectionNavigation: React.FC<SectionNavigationProps> = ({
  lesson,
  currentSection,
  lessonProgress,
  onSectionChange,
  onBackToLessons,
  onHomeClick
}) => {
  // Helper function to get section icon
  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'theory': return <BookOpen className="w-4 h-4" />;
      case 'reading': return <Glasses className="w-4 h-4" />;
      case 'exercises': return <Puzzle className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  // Helper function to get section status
  const getSectionStatus = (section: string) => {
    switch (section) {
      case 'theory': return lessonProgress.theory_completed ? '✅' : '⏳';
      case 'reading': return lessonProgress.reading_completed ? '✅' : '⏳';
      case 'exercises': 
        if (lessonProgress.exercises_completed >= lessonProgress.total_exercises) return '✅';
        if (lessonProgress.exercises_completed > 0) return '🔄';
        return '⏳';
      default: return '⏳';
    }
  };

  // Get exercise types summary for practice section
  const getExerciseTypesSummary = () => {
    const types = lesson.exercises.map(ex => ExerciseTypeIcons[ex.type as keyof typeof ExerciseTypeIcons] || '📝');
    return Array.from(new Set(types)).join(' ');
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
        <div className="flex items-center justify-between">
          {/* Left side - Back navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onHomeClick}
              className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </button>
            
            <button
              onClick={onBackToLessons}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Lessons
            </button>
          </div>

          {/* Center - Lesson info */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800">{lesson.title}</h2>
            <p className="text-sm text-gray-600">{lesson.subtitle}</p>
          </div>

          {/* Right side - Time estimate */}
          <div className="text-right text-sm text-gray-500">
            <span>⏱️ {lesson.estimatedMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
        <div className="flex justify-center space-x-4">
          {/* Theory Section */}
          <button
            onClick={() => onSectionChange('theory')}
            className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
              currentSection === 'theory' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {getSectionIcon('theory')}
            <span className="ml-2 font-medium">Theory</span>
            <span className="ml-2">{getSectionStatus('theory')}</span>
          </button>

          {/* Reading Section */}
          <button
            onClick={() => onSectionChange('reading')}
            className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
              currentSection === 'reading' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {getSectionIcon('reading')}
            <span className="ml-2 font-medium">Reading</span>
            <span className="ml-2">{getSectionStatus('reading')}</span>
          </button>

          {/* Exercises Section */}
          <button
            onClick={() => onSectionChange('exercises')}
            className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
              currentSection === 'exercises' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {getSectionIcon('exercises')}
            <span className="ml-2 font-medium">Practice</span>
            <span className="ml-2">{getSectionStatus('exercises')}</span>
            <span className="ml-1 text-xs opacity-75">
              ({lessonProgress.exercises_completed}/{lessonProgress.total_exercises})
            </span>
          </button>
        </div>

        {/* Exercise Types Preview (only show on exercises section) */}
        {currentSection === 'exercises' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Exercise Types in this Lesson:</p>
              <div className="flex justify-center space-x-4">
                {lesson.exercises.map((exercise, index) => {
                  const icon = ExerciseTypeIcons[exercise.type as keyof typeof ExerciseTypeIcons] || '📝';
                  return (
                    <div key={index} className="flex items-center space-x-1 text-sm">
                      <span>{icon}</span>
                      <span className="capitalize text-gray-600">
                        {exercise.type.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total: {getExerciseTypesSummary()} ({lesson.exercises.length} exercises)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Lesson Progress</h3>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {(lessonProgress.theory_completed ? 1 : 0) + 
                 (lessonProgress.reading_completed ? 1 : 0) + 
                 (lessonProgress.exercises_completed >= lessonProgress.total_exercises ? 1 : 0)}/3
              </div>
              <div className="text-xs text-gray-500">Sections Done</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {lessonProgress.exercises_completed}/{lessonProgress.total_exercises}
              </div>
              <div className="text-xs text-gray-500">Exercises Done</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {lessonProgress.lessonFullyCompleted ? '✅' : '🔄'}
              </div>
              <div className="text-xs text-gray-500">
                {lessonProgress.lessonFullyCompleted ? 'Complete' : 'In Progress'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SectionNavigation;