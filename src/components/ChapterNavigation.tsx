import React from 'react';
import { Heart, ChevronRight } from 'lucide-react';
import { Chapter, AppProgress, ChapterNavigationProps } from '../types';

const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  chapters,
  currentChapter,
  appProgress,
  onChapterSelect,
  onHomeClick,
  favoritesCount
}) => {
  // Helper function to get chapter progress
  const getChapterProgress = (chapterId: number) => {
    const chapterProgress = appProgress.chapters[chapterId];
    if (!chapterProgress) return { completed: 0, total: 0, percentage: 0 };

    const lessons = Object.values(chapterProgress.lessons);
    const completed = lessons.filter(lesson => lesson.lessonFullyCompleted).length;
    const total = lessons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  // Helper function to get progress color
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage > 0) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  // Helper function to get progress icon
  const getProgressIcon = (percentage: number) => {
    if (percentage === 100) return '✅';
    if (percentage > 0) return '🔄';
    return '⏳';
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Finnish Chapters</h2>
          <p className="text-gray-600">Choose a chapter to begin learning</p>
        </div>
        
        {/* Favorites Button */}
        <button
          onClick={() => {/* Will be connected to favorites function */}}
          className="flex items-center bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg transition-colors"
        >
          <Heart className="w-5 h-5 mr-2" />
          Favorites ({favoritesCount})
        </button>
      </div>

      {/* Chapters Grid */}
      <div className="grid gap-4">
        {chapters.map((chapter) => {
          const progress = getChapterProgress(chapter.id);
          const progressColor = getProgressColor(progress.percentage);
          const progressIcon = getProgressIcon(progress.percentage);

          return (
            <div
              key={chapter.id}
              className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer bg-gray-50 hover:bg-gray-100"
              onClick={() => onChapterSelect(chapter)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Chapter Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {chapter.id}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-600">{chapter.title}</h3>
                      <p className="text-gray-600">{chapter.subtitle}</p>
                    </div>
                    <span className="text-2xl">{progressIcon}</span>
                  </div>

                  {/* Chapter Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>📚 {chapter.lessons.length} lessons</span>
                    <span>⏱️ {chapter.estimatedHours}h</span>
                    <span>📖 Pages {chapter.pageNumbers}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {chapter.difficulty}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progress.completed}/{progress.total} lessons completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${progressColor}`}
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Lessons Preview */}
                  <div className="flex flex-wrap gap-1">
                    {chapter.lessons.slice(0, 3).map((lesson, index) => {
                      const lessonProgress = appProgress.chapters[chapter.id]?.lessons[lesson.id];
                      const lessonIcon = lessonProgress?.lessonFullyCompleted ? '✅' : 
                                       (lessonProgress?.theory_completed || lessonProgress?.reading_completed || lessonProgress?.exercises_completed > 0) ? '🔄' : '⏳';
                      
                      return (
                        <span key={lesson.id} className="text-xs bg-white px-2 py-1 rounded border">
                          {lessonIcon} Lesson {index + 1}
                        </span>
                      );
                    })}
                    {chapter.lessons.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{chapter.lessons.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-6 h-6 text-gray-400 ml-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      {chapters.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {chapters.reduce((acc, ch) => acc + getChapterProgress(ch.id).completed, 0)}
              </div>
              <div className="text-sm text-gray-600">Lessons Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {chapters.filter(ch => getChapterProgress(ch.id).percentage === 100).length}
              </div>
              <div className="text-sm text-gray-600">Chapters Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(chapters.reduce((acc, ch) => acc + getChapterProgress(ch.id).percentage, 0) / chapters.length) || 0}%
              </div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterNavigation;