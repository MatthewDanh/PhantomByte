import React from 'react';
import type { BootMessage } from '../types';

interface BootingScreenProps {
  messages: BootMessage[];
  progress: number;
}

const BootingScreen: React.FC<BootingScreenProps> = ({ messages, progress }) => {
  return (
    <div className="w-full max-w-2xl neumorphic-inset gradient-border p-6 font-mono text-lg">
      <h2 className="font-hacker text-3xl text-cyan-400 mb-4 tracking-widest">SYSTEM BOOT SEQUENCE</h2>
      <div className="space-y-2 text-gray-300">
        {messages.map((msg, index) => (
          <div key={index} className="flex justify-between items-center">
            <span>{msg.text}</span>
            {msg.status === 'pending' && <span className="text-gray-500">...</span>}
            {msg.status === 'ok' && <span className="text-green-400">[ OK ]</span>}
            {msg.status === 'fail' && <span className="text-red-400">[ FAIL ]</span>}
          </div>
        ))}
      </div>
      <div className="w-full bg-black/50 rounded-full mt-6 h-6 p-1 neumorphic-inset">
        <div 
            className="h-full rounded-full transition-all duration-300 ease-linear"
            style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, var(--primary-accent) 0%, var(--secondary-accent) 100%)`
            }}
        ></div>
      </div>
      <p className="text-center mt-2 text-cyan-300 font-hacker text-xl">{Math.floor(progress)}% COMPLETE</p>
    </div>
  );
};

export default BootingScreen;
