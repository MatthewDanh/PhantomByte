import React from 'react';
import type { CodexEntry } from '../types';
import { BookOpenIcon } from './Icons';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: CodexEntry[];
}

const CodexModal: React.FC<CodexModalProps> = ({ isOpen, onClose, entries }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="neumorphic-outset gradient-border max-w-2xl w-full p-6 text-center max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center mb-4">
            <BookOpenIcon className="w-8 h-8 text-purple-400 mr-3" />
            <h2 className="text-3xl font-hacker text-cyan-400 tracking-widest">AGENT CODEX</h2>
        </div>
        <div className="overflow-y-auto pr-2">
            {entries.length > 0 ? (
                 [...entries].reverse().map((entry, index) => (
                    <div key={index} className="neumorphic-inset text-left p-4 mb-4 last:mb-0">
                        <h3 className="text-xl font-bold text-purple-300 font-hacker tracking-wide">{entry.title}</h3>
                        <p className="text-gray-300 mt-1">{entry.content}</p>
                    </div>
                ))
            ) : (
                <p className="text-gray-400 italic mt-4">No intel collected yet. Complete mission objectives to populate the codex.</p>
            )}
        </div>
        <button
            onClick={onClose}
            className="mt-6 px-6 py-2 text-white font-bold rounded-lg neumorphic-outset hover:border-gray-400 transition-all duration-300 text-lg font-hacker self-center"
        >
            Close
        </button>
      </div>
    </div>
  );
};

export default CodexModal;