import React from 'react';
import { Book, Target, Zap } from 'lucide-react';

interface StatsCardsProps {
  lessonsCount: number;
  wordsCount: number;
  favoritesCount: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ 
  lessonsCount, 
  wordsCount, 
  favoritesCount 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-lg text-center">
        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Book className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-blue-600">{lessonsCount}</h3>
        <p className="text-gray-600">Lessons</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-lg text-center">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-600">{wordsCount}</h3>
        <p className="text-gray-600">Words</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-lg text-center">
        <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-purple-600">{favoritesCount}</h3>
        <p className="text-gray-600">Favorites</p>
      </div>
    </div>
  );
};

export default StatsCards;
