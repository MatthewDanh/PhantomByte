
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FirewallIcon } from './Icons';

interface FirewallMiniGameProps {
  title: string;
  challengeLines: string[];
  onComplete: () => void;
}

const FirewallMiniGame: React.FC<FirewallMiniGameProps> = ({ title, challengeLines, onComplete }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentChallengeLine = challengeLines[currentLineIndex];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentLineIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length > typedText.length) {
        const lastCharIndex = value.length - 1;
        if (value[lastCharIndex] !== currentChallengeLine[lastCharIndex]) {
            setHasError(true);
            setTimeout(() => setHasError(false), 500);
        }
    }

    setTypedText(value);

    if (value === currentChallengeLine) {
      if (currentLineIndex === challengeLines.length - 1) {
        onComplete();
      } else {
        setCurrentLineIndex(prev => prev + 1);
        setTypedText('');
      }
    }
  };
  
  const characterDisplay = useMemo(() => {
    if (!currentChallengeLine) return null;
    return currentChallengeLine.split('').map((char, index) => {
      let colorClass = 'text-gray-600';
      if (index < typedText.length) {
        colorClass = char === typedText[index] ? 'text-green-300' : 'text-red-400';
      }
      return <span key={index} className={`transition-colors duration-100 ${colorClass}`}>{char}</span>;
    });
  }, [currentChallengeLine, typedText]);

  return (
    <div className="w-full neumorphic-inset border-2 border-green-500/30 p-6 text-green-400 scanline-overlay" onClick={() => inputRef.current?.focus()}>
        <div className="flex items-center mb-4">
            <FirewallIcon className="w-8 h-8 text-yellow-400 mr-3" />
            <h2 className="text-2xl font-hacker tracking-widest text-yellow-400 uppercase">{title}</h2>
        </div>
        <p className="mb-4 text-green-300/80">Execute the following security overrides ({currentLineIndex + 1}/{challengeLines.length}):</p>
        
        <div className="bg-gray-900/50 p-4 rounded-md font-mono text-xl tracking-wider select-none">
            {challengeLines.map((line, index) => (
                 <div key={index} className={`whitespace-pre ${index === currentLineIndex ? 'opacity-100' : 'opacity-30'}`}>
                    <span className="text-gray-500 mr-2">{'>'}</span>
                    {index === currentLineIndex ? characterDisplay : <span className='text-gray-400'>{line}</span>}
                </div>
            ))}
        </div>

        {hasError && <p className="mt-4 text-red-400 font-hacker text-lg animate-shake">Error: Command Mismatch</p>}
      
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

export default FirewallMiniGame;