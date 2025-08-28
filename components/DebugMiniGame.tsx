import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { DebugChallenge } from '../types';
import { BugIcon } from './Icons';

interface DebugMiniGameProps {
  title: string;
  challenge: DebugChallenge;
  onComplete: () => void;
}

const DebugMiniGame: React.FC<DebugMiniGameProps> = ({ title, challenge, onComplete }) => {
  const [typedText, setTypedText] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { description, buggyCode, correctCode } = challenge;

  useEffect(() => {
    setTypedText('');
    setHasError(false);
    inputRef.current?.focus();
  }, [challenge]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length > typedText.length) {
        const lastCharIndex = value.length - 1;
        if (value[lastCharIndex] !== correctCode[lastCharIndex]) {
            setHasError(true);
            setTimeout(() => setHasError(false), 500);
        }
    }

    setTypedText(value);

    if (value === correctCode) {
        onComplete();
    }
  };
  
  const characterDisplay = useMemo(() => {
    return correctCode.split('').map((char, index) => {
      let colorClass = 'text-gray-600';
      if (index < typedText.length) {
        colorClass = char === typedText[index] ? 'text-amber-300' : 'text-red-400';
      }
      return <span key={index} className={`transition-colors duration-100 ${colorClass}`}>{char}</span>;
    });
  }, [correctCode, typedText]);

  return (
    <div className="w-full neumorphic-inset border-2 border-amber-500/30 p-6 text-amber-400 scanline-overlay" onClick={() => inputRef.current?.focus()}>
        <div className="flex items-center mb-4">
            <BugIcon className="w-8 h-8 text-red-500 mr-3" />
            <h2 className="text-2xl font-hacker tracking-widest text-amber-400 uppercase">{title}</h2>
        </div>
        <p className="mb-2 text-amber-300/80">{description}</p>
        <div className="bg-gray-900/50 p-4 rounded-md font-mono text-xl tracking-wider select-none space-y-2">
            <div>
                <span className="text-red-500/80 mr-2 text-sm font-sans">BUGGY:</span>
                <span className="text-gray-500">{buggyCode}</span>
            </div>
             <div>
                <span className="text-green-500/80 mr-2 text-sm font-sans">FIXED:</span>
                <span className={hasError ? 'animate-shake' : ''}>{characterDisplay}</span>
            </div>
        </div>
      
      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={handleInputChange}
        autoFocus
        className="absolute w-px h-px opacity-0"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
    </div>
  );
};

export default DebugMiniGame;