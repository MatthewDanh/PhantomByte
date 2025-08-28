import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { GameState, Scene, TypingStats, StoryHistoryItem, Difficulty, BootMessage, PlayerStats, CodexEntry, Location } from './types';
import { fetchNextScene } from './services/geminiService';
import GameContainer from './components/GameContainer';
import StoryDisplay from './components/StoryDisplay';
import TypingChallenge from './components/TypingChallenge';
import Hud from './components/Hud';
import BootingScreen from './components/BootingScreen';
import FirewallMiniGame from './components/FirewallMiniGame';
import DebugMiniGame from './components/DebugMiniGame';
import ConfirmDialog from './components/ConfirmDialog';
import CodexModal from './components/CodexModal';
import DynamicBackground from './components/DynamicBackground';
import WorldMap from './components/WorldMap';
import { SignalSlashIcon, PowerIcon, BookOpenIcon } from './components/Icons';

const initialBootMessages: Omit<BootMessage, 'status'>[] = [
    { text: 'Initializing K.A.I. drone...' },
    { text: 'Establishing neural link...' },
    { text: 'Loading exploit packages...' },
    { text: 'Compiling trace-route daemon...' },
    { text: 'Bypassing primary firewalls...' },
    { text: 'Decrypting PhantomByte comms...' },
    { text: 'Secure connection established.' },
];

const RANKS = [
  { name: 'Rookie', xpToNext: 100 },
  { name: 'Field Agent', xpToNext: 250 },
  { name: 'Specialist', xpToNext: 500 },
  { name: 'Elite Operator', xpToNext: 1000 },
  { name: 'Phantom Hunter', xpToNext: Infinity },
];

const AgentLoginScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [typedId, setTypedId] = useState('');
    const agentId = 'AGENT-7';

    useEffect(() => {
        // Step 0: Start typing Agent ID
        if (step === 0) {
            const typingInterval = setInterval(() => {
                setTypedId(prev => {
                    if (prev.length < agentId.length) {
                        return agentId.substring(0, prev.length + 1);
                    } else {
                        clearInterval(typingInterval);
                        setTimeout(() => setStep(1), 500); // Wait after typing
                        return prev;
                    }
                });
            }, 150);
            return () => clearInterval(typingInterval);
        }
        // Step 1: Authenticating
        if (step === 1) {
            const timer = setTimeout(() => setStep(2), 1500);
            return () => clearTimeout(timer);
        }
        // Step 2: Access Granted
        if (step === 2) {
            const timer = setTimeout(onComplete, 1500);
            return () => clearTimeout(timer);
        }
    }, [step, onComplete]);

    return (
        <div className="font-mono text-cyan-300 text-2xl p-8 neumorphic-inset gradient-border">
            <p>> AGENT ID: {typedId}{step === 0 && <span className="w-4 h-6 bg-cyan-300 inline-block ml-1 cursor-blink" />}</p>
            {step >= 1 && <p>> AUTHENTICATING... <span className="text-gray-500">[ENCRYPTED]</span></p>}
            {step >= 2 && <p className="text-green-400">> ACCESS GRANTED. WELCOME, AGENT.</p>}
        </div>
    );
};

const Typewriter: React.FC<{ text: string; speed?: number; className?: string; onComplete?: () => void; }> = ({ text, speed = 25, className, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    
    useEffect(() => {
        setDisplayedText('');
        setIsComplete(false);
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(intervalId);
                setIsComplete(true);
                if (onComplete) onComplete();
            }
        }, speed);
        return () => clearInterval(intervalId);
    }, [text, speed, onComplete]);
    
    return (
        <div className={className}>
            {displayedText}
            {!isComplete && <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse ml-1" />}
        </div>
    );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [storyHistory, setStoryHistory] = useState<StoryHistoryItem[]>([]);
  const [stats, setStats] = useState<TypingStats>({ wpm: 0, accuracy: 100 });
  const [error, setError] = useState<string | null>(null);
  const [bootMessages, setBootMessages] = useState<BootMessage[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ rank: RANKS[0].name, rankIndex: 0, xp: 0 });
  const [codex, setCodex] = useState<CodexEntry[]>([]);
  const [traceHistory, setTraceHistory] = useState<Location[]>([]);
  
  const [startScreenStep, setStartScreenStep] = useState(0); // 0: login, 1: intro, 2: difficulty
  const [briefingComplete, setBriefingComplete] = useState(false);

  useEffect(() => {
    if (gameState === 'loading') {
      setBootMessages(initialBootMessages.map(m => ({ ...m, status: 'pending' })));
      setLoadingProgress(0);
      
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        if(messageIndex < initialBootMessages.length) {
          setBootMessages(prev => {
            const newMessages = [...prev];
            newMessages[messageIndex] = { ...newMessages[messageIndex], status: 'ok' };
            return newMessages;
          });
          messageIndex++;
        } else {
          clearInterval(messageInterval);
        }
      }, 450);

      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 1;
        });
      }, 35);

      return () => {
        clearInterval(messageInterval);
        clearInterval(progressInterval);
      };
    }
  }, [gameState]);
  
  const rankInfo = useMemo(() => RANKS[playerStats.rankIndex], [playerStats.rankIndex]);

  const processScene = useCallback((scene: Scene) => {
    setCurrentScene(scene);
    setStoryHistory(prev => [...prev, { text: scene.story, source: 'mc' }]);
    if (scene.codexEntries) {
        setCodex(prevCodex => {
            const newEntries = scene.codexEntries!.filter(
                entry => !prevCodex.some(existing => existing.title === entry.title)
            );
            return [...prevCodex, ...newEntries];
        });
    }

    if (scene.location) {
        setTraceHistory(prev => [...prev, scene.location!]);
    }

    if (scene.challengeType === 'firewall' || scene.challengeType === 'debug') {
      setGameState('minigame');
    } else {
      setGameState('playing');
    }
    setIsTransitioning(false);
  }, []);

  const startGame = useCallback(async (selectedDifficulty: Difficulty) => {
    setGameState('loading');
    setDifficulty(selectedDifficulty);
    setError(null);
    setStoryHistory([]);
    setStats({ wpm: 0, accuracy: 100 });
    setPlayerStats({ rank: RANKS[0].name, rankIndex: 0, xp: 0 });
    setCodex([]);
    setTraceHistory([]);

    try {
      const firstScene = await fetchNextScene(undefined, selectedDifficulty, RANKS[0].name);
      setTimeout(() => processScene(firstScene), 3800); // Wait for boot animation
    } catch (err) {
      console.error(err);
      setError('A critical system error occurred. Could not establish a secure connection.');
      setGameState('error');
    }
  }, [processScene]);
  
  const restartGame = useCallback(() => {
    setIsRestartModalOpen(false);
    setStartScreenStep(0);
    setGameState('start');
    setDifficulty(null);
    setBriefingComplete(false);
  }, []);
  
  const advanceStory = useCallback(async (playerAction: string) => {
    if (!difficulty) {
        setError('Difficulty not set. System error.');
        setGameState('error');
        return;
    }
    setIsTransitioning(true);
    setError(null);
    
    setStoryHistory(prev => [...prev, { text: playerAction, source: 'player' }]);

    try {
      const nextScene = await fetchNextScene(playerAction, difficulty, playerStats.rank);
      if (nextScene.challengeType === 'firewall' || nextScene.challengeType === 'debug') {
          setGameState('loading');
          setTimeout(() => processScene(nextScene), 3800);
      } else {
          processScene(nextScene);
      }
    } catch (err)      {
      console.error(err);
      setError('The connection to the target server was lost. We need to re-route.');
      setGameState('error');
      setIsTransitioning(false);
    }
  }, [difficulty, playerStats.rank, processScene]);

  const addXp = useCallback((xp: number) => {
    setPlayerStats(prev => {
        const newXp = prev.xp + xp;
        if (newXp >= rankInfo.xpToNext) {
            const newRankIndex = Math.min(prev.rankIndex + 1, RANKS.length - 1);
            return {
                ...prev,
                xp: newXp - rankInfo.xpToNext,
                rankIndex: newRankIndex,
                rank: RANKS[newRankIndex].name,
            };
        }
        return { ...prev, xp: newXp };
    });
  }, [rankInfo]);

  const handleChallengeComplete = useCallback(async (typingStats: TypingStats, word: string) => {
    const xpGained = Math.round(typingStats.wpm / 4 + typingStats.accuracy / 10);
    addXp(xpGained);
    setStats(prevStats => ({
      wpm: Math.round((prevStats.wpm + typingStats.wpm) / 2),
      accuracy: Math.round((prevStats.accuracy + typingStats.accuracy) / 2)
    }));
    const positiveOutcome = currentScene?.positiveOutcome || `Command executed: "${word}"!`;
    advanceStory(positiveOutcome);
  }, [currentScene, advanceStory, addXp]);

  const handleMiniGameComplete = useCallback(() => {
    const xpGained = 50; // Flat XP for minigames
    addXp(xpGained);
    const positiveOutcome = currentScene?.positiveOutcome || `System breached! Access granted.`;
    advanceStory(positiveOutcome);
  }, [currentScene, advanceStory, addXp]);

  const renderContent = () => {
    switch (gameState) {
      case 'start':
        return (
          <div className="text-center flex flex-col items-center max-w-4xl font-mono">
              {startScreenStep === 0 && <AgentLoginScreen onComplete={() => setStartScreenStep(1)} />}
              {startScreenStep === 1 && (
                  <div className="animate-fadeIn w-full">
                     <h1 className="text-6xl font-hacker text-cyan-400 mb-4 tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]">
                        PhantomByte Pursuit
                     </h1>
                     <Typewriter 
                         text="Welcome, Agent. Your mission is to hunt the notorious hacker &quot;PhantomByte&quot;. You'll be assisted by our drone, K.A.I. (Kinetic Autonomous Investigator). Use your terminal to issue commands, breach firewalls, and recover stolen data."
                         className="text-gray-400 mb-8 text-lg max-w-2xl mx-auto min-h-[144px]"
                         onComplete={() => setBriefingComplete(true)}
                     />
                    {briefingComplete && <button onClick={() => setStartScreenStep(2)} className="animate-fadeIn px-8 py-3 neumorphic-outset text-cyan-300 font-bold rounded-lg hover:text-cyan-200 transition-all duration-300 text-2xl font-hacker tracking-wide">Initiate Mission</button>}
                  </div>
              )}
            {startScreenStep === 2 && (
                <div className="mt-4 animate-fadeIn">
                <h2 className="text-3xl font-hacker text-cyan-400 mb-6">Select Mission Difficulty</h2>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button onClick={() => startGame('Easy')} className="px-8 py-4 bg-green-500/10 text-green-300 font-bold rounded-lg neumorphic-outset border-green-500/30 text-2xl font-hacker tracking-wide difficulty-button difficulty-easy">Easy</button>
                  <button onClick={() => startGame('Medium')} className="px-8 py-4 bg-yellow-500/10 text-yellow-300 font-bold rounded-lg neumorphic-outset border-yellow-500/30 text-2xl font-hacker tracking-wide difficulty-button difficulty-medium">Medium</button>
                  <button onClick={() => startGame('Hard')} className="px-8 py-4 bg-red-500/10 text-red-300 font-bold rounded-lg neumorphic-outset border-red-500/30 text-2xl font-hacker tracking-wide difficulty-button difficulty-hard">Hard</button>
                </div>
              </div>
            )}
          </div>
        );
      case 'loading':
        return <BootingScreen messages={bootMessages} progress={loadingProgress} />;
      case 'error':
        return (
          <div className="text-center flex flex-col items-center">
            <SignalSlashIcon className="w-24 h-24 text-red-500 mb-4" />
            <h2 className="text-3xl font-hacker text-red-400 mb-4 tracking-wide glitch-effect" data-text="SYSTEM ANOMALY">SYSTEM ANOMALY</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button onClick={restartGame} className="px-6 py-3 neumorphic-outset text-cyan-300 font-bold rounded-lg hover:text-cyan-200 transition-all duration-300 text-xl font-hacker tracking-wide">Restart Mission</button>
          </div>
        );
      case 'playing':
      case 'minigame':
        if (!currentScene) return null;
        return (
          <div className="relative w-full max-w-screen-2xl mx-auto p-8 border border-cyan-500/10">
            <div className="hud-corner top-left"></div>
            <div className="hud-corner top-right"></div>
            <div className="hud-corner bottom-left"></div>
            <div className="hud-corner bottom-right"></div>
            
            <GameContainer>
              <div className="absolute top-4 right-4 flex space-x-2 z-10">
                 <button onClick={() => setIsCodexOpen(true)} className="text-gray-400 hover:text-purple-400 transition-colors p-2 rounded-full neumorphic-outset" aria-label="Open Codex"><BookOpenIcon className="w-7 h-7" /></button>
                 <button onClick={() => setIsRestartModalOpen(true)} className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-full neumorphic-outset" aria-label="Restart Mission"><PowerIcon className="w-7 h-7" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 w-full max-w-7xl mx-auto">
                <div className="md:col-span-3 flex flex-col space-y-4">
                  <WorldMap traceHistory={traceHistory} />
                  <StoryDisplay storyHistory={storyHistory} codexEntries={codex} />
                </div>
                <div className="md:col-span-2 flex flex-col justify-start items-center h-full">
                  <div className="w-full sticky top-8 space-y-8">
                    <Hud stats={stats} playerStats={playerStats} rankInfo={rankInfo} />
                    {gameState === 'playing' && (
                      <TypingChallenge challengeWord={currentScene.challengeWord} onComplete={handleChallengeComplete} isTransitioning={isTransitioning} />
                    )}
                    {gameState === 'minigame' && currentScene.challengeType === 'firewall' && currentScene.firewallChallenge && (
                       <FirewallMiniGame title={currentScene.challengeWord} challengeLines={currentScene.firewallChallenge} onComplete={handleMiniGameComplete} />
                    )}
                    {gameState === 'minigame' && currentScene.challengeType === 'debug' && currentScene.debugChallenge && (
                       <DebugMiniGame title={currentScene.challengeWord} challenge={currentScene.debugChallenge} onComplete={handleMiniGameComplete} />
                    )}
                  </div>
                </div>
              </div>
            </GameContainer>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-gray-900">
      <DynamicBackground />
      <div key={gameState} className="w-full h-full flex items-center justify-center animate-fadeIn">
        {renderContent()}
      </div>
      <ConfirmDialog isOpen={isRestartModalOpen} onConfirm={restartGame} onCancel={() => setIsRestartModalOpen(false)} title="Abort Mission?">
        <p>Are you sure you want to return to the main menu? Your current progress will be lost.</p>
      </ConfirmDialog>
      <CodexModal isOpen={isCodexOpen} onClose={() => setIsCodexOpen(false)} entries={codex} />
    </main>
  );
};

export default App;