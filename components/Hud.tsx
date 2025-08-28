import React, { useState, useEffect } from 'react';
import type { TypingStats, PlayerStats } from '../types';
import { BoltIcon, ShieldCheckIcon } from './Icons';

interface HudProps {
  stats: TypingStats;
  playerStats: PlayerStats;
  rankInfo: { name: string; xpToNext: number };
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; valueKey?: any; }> = ({ icon, label, value, valueKey }) => (
    <div className="flex-1 flex items-center neumorphic-inset px-4 py-2">
      {icon}
      <span className="font-bold text-gray-300 mr-2">{label}:</span>
      <span key={valueKey} className="font-mono text-lg text-white animate-pulse-cyan">{value}</span>
    </div>
);

const Hud: React.FC<HudProps> = ({ stats, playerStats, rankInfo }) => {
  const [wpmKey, setWpmKey] = useState(0);
  const [accKey, setAccKey] = useState(0);

  useEffect(() => {
    setWpmKey(k => k + 1);
  }, [stats.wpm]);

  useEffect(() => {
    setAccKey(k => k + 1);
  }, [stats.accuracy]);
  
  const xpPercentage = rankInfo.xpToNext === Infinity ? 100 : Math.round((playerStats.xp / rankInfo.xpToNext) * 100);

  return (
    <div className="w-full space-y-4">
        {/* Agent Info */}
        <div className='neumorphic-inset p-4'>
            <div className='flex justify-between items-center mb-2'>
                <h3 className='font-hacker text-xl text-cyan-300'>Clearance: {playerStats.rank}</h3>
                <span className='text-gray-400 font-mono text-sm'>XP: {playerStats.xp} / {rankInfo.xpToNext === Infinity ? '---' : rankInfo.xpToNext}</span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-3 neumorphic-inset p-0.5">
                <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                        width: `${xpPercentage}%`,
                        background: `linear-gradient(90deg, var(--primary-accent) 0%, var(--secondary-accent) 100%)`
                    }}
                ></div>
            </div>
        </div>

        {/* Core Stats */}
        <div className="flex justify-center space-x-4">
            <StatItem icon={<BoltIcon className="w-6 h-6 text-cyan-400 mr-2" />} label="Speed" value={stats.wpm} valueKey={wpmKey} />
            <StatItem icon={<ShieldCheckIcon className="w-6 h-6 text-green-400 mr-2" />} label="Integrity" value={`${stats.accuracy.toFixed(0)}%`} valueKey={accKey} />
        </div>
    </div>
  );
};

export default Hud;