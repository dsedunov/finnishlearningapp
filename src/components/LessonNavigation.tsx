import React from 'react';
import { Home, ChevronLeft, ChevronRight, Clock, BookOpen } from 'lucide-react';
import { LessonNavigationProps, ExerciseTypeIcons } from '../types';

const LessonNavigation: React.FC<LessonNavigationProps> = ({
  chapter,
  currentLesson,
  chapterProgress,
  onLessonSelect,
  onBackToChapter,
  onHomeClick
}) => {
  // Helper function to get lesson status
  const getLessonStatus = (lessonId: string) => {
    const lessonProgress = chapterProgress?.lessons[lessonId];
    if (!lessonProgress) return '⏳';
    
    if (lessonProgress.lessonFullyCompleted) return '✅';
    if (lessonProgress.theory_completed || lessonProgress.reading_completed || lessonProgress.exercises_completed > 0) {
      return '🔄';
    }
    return '⏳';
  };

  // Helper function to get section completion
  const getSectionCompletion = (lessonId: string) => {
    const lessonProgress = chapterProgress?.lessons[lessonId];
    if (!lessonProgress) return { theory: '⏳', reading: '⏳', exercises: '⏳' };

    return {
      theory: lessonProgress.theory_completed ? '✅' : '⏳',
      reading: lessonProgress.reading_completed ? '✅' : '⏳',
      exercises: lessonProgress.exercises_completed >= lessonProgress.total_exercises ? '✅' : 
                 lessonProgress.exercises_completed > 0 ? '🔄' : '⏳'
    };
  };

  // Helper function to get exercise types summary
  const getExerciseTypesSummary = (lesson: any) => {
    const types = lesson.exercises.map((ex: any) => ExerciseTypeIcons[ex.type as keyof typeof ExerciseTypeIcons] || '📝');
    return Array.from(new Set(types)).join(' ');
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onHomeClick}
            className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
          
          <button
            onClick={onBackToChapter}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Chapters
          </button>
        </div>
      </div>

      {/* Chapter Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
            {chapter.id}
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-800">{chapter.title}</h2>
            <p className="text-blue-600">{chapter.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-blue-600">
          <span>📚 {chapter.lessons.length} lessons</span>
          <span>⏱️ {chapter.estimatedHours}h total</span>
          <span>📖 Pages {chapter.pageNumbers}</span>
          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
            {chapter.difficulty}
          </span>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lessons in this Chapter</h3>
        
        {chapter.lessons.map((lesson, index) => {
          const status = getLessonStatus(lesson.id);
          const sections = getSectionCompletion(lesson.id);
          const exerciseTypes = getExerciseTypesSummary(lesson);
          const isSelected = currentLesson?.id === lesson.id;

          return (
            <div
              key={lesson.id}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => onLessonSelect(lesson)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Lesson Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800">{lesson.title}</h4>
                      <p className="text-gray-600">{lesson.subtitle}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{status}</span>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{lesson.estimatedMinutes}min</span>
                    </div>
                  </div>

                  {/* Section Progress */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>Theory</span>
                      <span>{sections.theory}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span>👓</span>
                      <span>Reading</span>
                      <span>{sections.reading}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span>🧩</span>
                      <span>Practice</span>
                      <span>{sections.exercises}</span>
                      <span className="text-xs text-gray-500">({exerciseTypes})</span>
                    </div>
                  </div>

                  {/* Exercise Info */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{lesson.exercises.length} exercises</span>
                    <span>Types: {exerciseTypes}</span>
                    {chapterProgress?.lessons[lesson.id] && (
                      <span>
                        {chapterProgress.lessons[lesson.id].exercises_completed}/{lesson.exercises.length} completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className={`w-6 h-6 ml-4 ${
                  isSelected ? 'text-blue-500' : 'text-gray-400'
                }`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chapter Progress Summary */}
      {chapterProgress && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">
                {Object.values(chapterProgress.lessons).filter(l => l.lessonFullyCompleted).length}
                /{chapter.lessons.length}
              </div>
              <div className="text-sm text-gray-600">Lessons Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">
                {Math.round(
                  (Object.values(chapterProgress.lessons).filter(l => l.lessonFullyCompleted).length / 
                   chapter.lessons.length) * 100
                ) || 0}%
              </div>
              <div className="text-sm text-gray-600">Chapter Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonNavigation;