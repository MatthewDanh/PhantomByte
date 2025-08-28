import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { TypingStats } from '../types';

interface TypingChallengeProps {
  challengeWord: string;
  onComplete: (stats: TypingStats, word: string) => void;
  isTransitioning: boolean;
}

const TypingChallenge: React.FC<TypingChallengeProps> = ({ challengeWord, onComplete, isTransitioning }) => {
  const [typedText, setTypedText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentWpm, setCurrentWpm] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [justCompletedChar, setJustCompletedChar] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isTransitioning) {
        setTypedText('');
        setStartTime(null);
        setCurrentWpm(0);
        setHasError(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        inputRef.current?.focus();
        setIsFocused(true);
    }
  }, [challengeWord, isTransitioning]);

  useEffect(() => {
    if (startTime) {
      intervalRef.current = window.setInterval(() => {
        const elapsedTime = (Date.now() - startTime) / 1000;
        if (elapsedTime > 0) {
          const wpm = (typedText.length / 5) / (elapsedTime / 60);
          setCurrentWpm(Math.round(wpm));
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, typedText]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const prevValue = typedText;

    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }

    if (value.length > prevValue.length) {
        const lastCharIndex = value.length - 1;
        if (value[lastCharIndex] === challengeWord[lastCharIndex]) {
            setJustCompletedChar(lastCharIndex);
            setTimeout(() => setJustCompletedChar(null), 300);
        } else {
            setHasError(true);
            setTimeout(() => setHasError(false), 500);
        }
    }

    setTypedText(value);

    if (value === challengeWord) {
      const endTime = Date.now();
      const durationInSeconds = (endTime - (startTime || endTime)) / 1000;
      const wpm = durationInSeconds > 0 ? Math.round(((challengeWord.length / 5) / durationInSeconds) * 60) : 0;
      
      const accuracy = 100; // Simplified for this version, can be enhanced later

      onComplete({ wpm: wpm, accuracy: accuracy }, challengeWord);
    }
  };
  
  const renderedChars = useMemo(() => {
    return challengeWord.split('').map((char, index) => {
      let colorClass = 'text-gray-500';
      if (index < typedText.length) {
        colorClass = char === typedText[index] ? 'text-green-400' : 'text-red-500';
      }
      
      const animationClass = justCompletedChar === index ? 'animate-flash-green' : '';

      return <span key={index} className={`transition-colors duration-200 ${colorClass} ${animationClass}`}>{char}</span>;
    });
  }, [challengeWord, typedText, justCompletedChar]);

  const cursorPosition = typedText.length;

  return (
    <div className="w-full flex flex-col items-center relative neumorphic-inset p-6 min-h-[178px] justify-center" onClick={() => inputRef.current?.focus()}>
      {isTransitioning ? (
          <div className="text-center">
              <p className="text-cyan-400 font-semibold text-lg animate-pulse">Receiving transmission...</p>
          </div>
      ) : (
        <>
          <div className={`absolute -top-5 flex items-center neumorphic-inset px-4 py-1 transition-opacity duration-300 ${startTime ? 'opacity-100' : 'opacity-0'}`}>
            <span className="font-mono text-lg text-white">{currentWpm}</span>
            <span className="ml-2 font-bold text-gray-300 text-sm">WPM</span>
          </div>

          <p className="text-cyan-400 font-semibold text-lg mb-2">
            <span className="text-gray-400 mr-2">></span>
            Enter Command:
          </p>
          <div className={`relative text-center font-hacker text-4xl md:text-5xl tracking-widest p-2 mb-2 select-none ${hasError ? 'animate-shake' : ''}`}>
            {renderedChars}
            {isFocused && (
                <span 
                    key="cursor" 
                    className="absolute top-0 bottom-0 text-cyan-400 cursor-blink"
                    style={{ left: `${cursorPosition}ch`}}
                >
                    █
                </span>
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
            className="absolute w-full h-full top-0 left-0 opacity-0 cursor-text"
            maxLength={challengeWord.length}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={isTransitioning}
          />
        </>
      )}
    </div>
  );
};

export default TypingChallenge;