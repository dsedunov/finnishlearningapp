import React from 'react';
import { Zap } from 'lucide-react';

interface UsageStatsProps {
  stats: {
    dailyUsed: number;
    dailyLimit: number;
    remaining: number;
    resetTime: string;
  };
}

const UsageStats: React.FC<UsageStatsProps> = ({ stats }) => {
  const percentage = (stats.dailyUsed / stats.dailyLimit) * 100;
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Zap className="w-4 h-4 text-yellow-500 mr-2" />
          <span className="text-sm font-medium">Free Tier Usage</span>
        </div>
        <span className="text-xs text-gray-500">{stats.dailyUsed}/{stats.dailyLimit}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${
            percentage > 80 ? 'bg-red-500' : 
            percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{stats.remaining} requests remaining</span>
        <span>Resets {stats.resetTime}</span>
      </div>
    </div>
  );
};

export default UsageStats;
