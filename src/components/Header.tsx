import React from 'react';

interface HeaderProps {
  onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <h1 
          className="text-3xl font-bold text-center text-blue-600 cursor-pointer" 
          onClick={onHomeClick}
        >
          Learn Finnish with joy! 🇫🇮
        </h1>
      </div>
    </div>
  );
};

export default Header;
