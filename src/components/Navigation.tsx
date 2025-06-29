import React from 'react';
import { Home, ChevronLeft, ChevronRight, Book, Play, Award, Heart } from 'lucide-react';

interface NavigationProps {
  currentTopic: any;
  currentSection: string;
  lessons: any[];
  favoritesCount: number;
  onHomeClick: () => void;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
  onSectionChange: (section: string) => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  currentTopic,
  currentSection,
  lessons,
  favoritesCount,
  onHomeClick,
  onPreviousLesson,
  onNextLesson,
  onSectionChange,
  canGoPrevious,
  canGoNext
}) => {
  if (!currentTopic || currentSection === 'home') {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onHomeClick}
            className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
          
          <button
            onClick={onPreviousLesson}
            className="flex items-center text-blue-600 hover:text-blue-800"
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800">{currentTopic?.title}</h2>
            <p className="text-sm text-gray-600">{currentTopic?.subtitle}</p>
          </div>
          
          <button
            onClick={onNextLesson}
            className="flex items-center text-blue-600 hover:text-blue-800"
            disabled={!canGoNext}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => onSectionChange('theory')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentSection === 'theory' ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Book className="w-4 h-4 mr-2" />
            Theory
          </button>
          
          <button
            onClick={() => onSectionChange('reading')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentSection === 'reading' ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Play className="w-4 h-4 mr-2" />
            Reading
          </button>
          
          <button
            onClick={() => onSectionChange('exercises')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentSection === 'exercises' ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Award className="w-4 h-4 mr-2" />
            Exercises
          </button>
          
          <button
            onClick={() => onSectionChange('favorites')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentSection === 'favorites' ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart className="w-4 h-4 mr-2" />
            Favorites ({favoritesCount})
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
