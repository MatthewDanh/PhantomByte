import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { StoryHistoryItem, CodexEntry } from '../types';

interface StoryDisplayProps {
  storyHistory: StoryHistoryItem[];
  codexEntries: CodexEntry[];
}

const StoryItem: React.FC<{ item: StoryHistoryItem, isLast: boolean, codexTerms: string[] }> = ({ item, isLast, codexTerms }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const prefix = item.source === 'mc' ? '[MC]: ' : '[AGENT]: ';
  const fullText = prefix + item.text;
  
  useEffect(() => {
    if (!isLast) {
      setDisplayedText(fullText);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(fullText.substring(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, 20); // Typing speed
    return () => clearInterval(intervalId);
  }, [fullText, isLast]);

  const renderedText = useMemo(() => {
    if (isTyping) return <>{displayedText}</>;

    const regex = new RegExp(`\\b(${codexTerms.join('|')})\\b`, 'gi');
    const parts = item.text.split(regex);

    return (
        <>
            <span className={item.source === 'mc' ? 'text-cyan-400' : 'text-gray-400'}>{prefix}</span>
            {parts.map((part, index) => 
                codexTerms.some(term => new RegExp(`^${term}$`, 'i').test(part))
                    ? <span key={index} className="text-purple-400 font-bold">{part}</span>
                    : <span key={index}>{part}</span>
            )}
        </>
    );
  }, [displayedText, isTyping, item.text, prefix, codexTerms, item.source]);


  return (
    <p className={`text-xl leading-relaxed ${item.source === 'player' ? 'text-gray-400 italic' : 'text-gray-200'}`}>
      {renderedText}
      {isTyping && <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse ml-1" />}
    </p>
  );
};


const StoryDisplay: React.FC<StoryDisplayProps> = ({ storyHistory, codexEntries }) => {
  const endOfStoryRef = useRef<HTMLDivElement>(null);
  const codexTerms = useMemo(() => codexEntries.map(e => e.title), [codexEntries]);

  useEffect(() => {
    endOfStoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyHistory]);

  return (
    <div className="w-full neumorphic-inset gradient-border p-6 h-[45vh] overflow-y-auto">
      {storyHistory.map((item, index) => (
        <div key={index} className="mb-8 last:mb-0">
          <StoryItem 
            item={item} 
            isLast={index === storyHistory.length - 1}
            codexTerms={codexTerms}
          />
        </div>
      ))}
      <div ref={endOfStoryRef} />
    </div>
  );
};

export default StoryDisplay;