import React from 'react';
import { ChevronRight } from 'lucide-react';

interface LessonsListProps {
  lessons: any[];
  onLessonSelect: (index: number) => void;
}

const LessonsList: React.FC<LessonsListProps> = ({ lessons, onLessonSelect }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Available Lessons</h2>
      <div className="grid gap-4">
        {lessons.map((topic, index) => (
          <div
            key={topic.id || index}
            className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onLessonSelect(index)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-600">{topic.title}</h3>
                <p className="text-gray-600">{topic.subtitle}</p>
                {topic.estimatedTime && (
                  <p className="text-sm text-gray-500 mt-1">⏱️ {topic.estimatedTime}</p>
                )}
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonsList;
