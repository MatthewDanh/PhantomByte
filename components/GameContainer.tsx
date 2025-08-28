
import React from 'react';

interface GameContainerProps {
  children: React.ReactNode;
}

const GameContainer: React.FC<GameContainerProps> = ({ children }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
      {children}
    </div>
  );
};

export default GameContainer;
