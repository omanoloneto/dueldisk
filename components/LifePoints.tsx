import React, { useState } from 'react';
import { RefreshCw, Delete, History, Dices, CircleDot } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/i18n';

interface LifePointsProps {
  lang: Language;
}

export const LifePoints: React.FC<LifePointsProps> = ({ lang }) => {
  const [lp, setLp] = useState(8000);
  const [inputValue, setInputValue] = useState('0');
  const [history, setHistory] = useState<number[]>([]);
  const [toolResult, setToolResult] = useState<string | null>(null);
  const t = translations[lang];

  const maxLp = 8000;
  const lpPercentage = Math.min(100, Math.max(0, (lp / maxLp) * 100));
  
  // Health Bar Color
  const getBarColor = () => {
      if (lpPercentage > 50) return 'bg-yugi-spell'; // Greenish
      if (lpPercentage > 25) return 'bg-yugi-monster'; // Yellow/Orange
      return 'bg-yugi-trap'; // Red/Pink
  };

  const triggerHaptic = () => {
      if (navigator.vibrate) navigator.vibrate(10);
  };

  const updateLP = (amount: number) => {
    setHistory(prev => [amount, ...prev].slice(0, 5)); 
    setLp(prev => Math.max(0, prev + amount));
    setInputValue('0');
    triggerHaptic();
  };

  const handleNumPress = (num: number) => {
    triggerHaptic();
    setInputValue(prev => {
        if (prev === '0') return String(num);
        if (prev.length > 5) return prev; 
        return prev + num;
    });
  };

  const handleBackspace = () => {
      triggerHaptic();
      setInputValue(prev => {
          if (prev.length <= 1) return '0';
          return prev.slice(0, -1);
      });
  };

  const applyCustom = (multiplier: 1 | -1) => {
      const val = parseInt(inputValue, 10);
      if (val > 0) {
          updateLP(val * multiplier);
      }
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLp(8000);
    setInputValue('0');
    setHistory([]);
    setToolResult(null);
    triggerHaptic();
  };

  const rollDice = () => {
      triggerHaptic();
      const result = Math.floor(Math.random() * 6) + 1;
      setToolResult(`${t.dice_roll} ${result}`);
      setTimeout(() => setToolResult(null), 3000);
  };

  const flipCoin = () => {
      triggerHaptic();
      const isHeads = Math.random() > 0.5;
      setToolResult(isHeads ? `🪙 ${t.coin_heads}` : `🪙 ${t.coin_tails}`);
      setTimeout(() => setToolResult(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-m3-background relative overflow-hidden pt-[env(safe-area-inset-top)]">
      
      {/* Health Bar (Visual Indicator) */}
      <div className="h-2 w-full bg-m3-surfaceContainerHigh">
          <div 
            className={`h-full transition-all duration-500 ease-out ${getBarColor()}`} 
            style={{ width: `${lpPercentage}%` }}
          />
      </div>

      {/* LP Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-m3-surfaceContainerLow transition-colors duration-300">
          
          {/* Centered Top Tools Bar - Pushed down by safe area */}
          <div className="absolute top-4 w-full flex justify-center z-50 pointer-events-none">
                <div className="pointer-events-auto flex gap-3 bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-sm">
                   <button onClick={rollDice} className="p-3 bg-m3-surfaceContainer/50 rounded-full text-m3-onSurfaceVariant hover:text-m3-primary hover:bg-m3-surfaceContainer active:scale-90 transition-all">
                       <Dices size={20} />
                   </button>
                   <button onClick={flipCoin} className="p-3 bg-m3-surfaceContainer/50 rounded-full text-m3-onSurfaceVariant hover:text-m3-primary hover:bg-m3-surfaceContainer active:scale-90 transition-all">
                       <CircleDot size={20} />
                   </button>
                   <button 
                        onClick={reset} 
                        aria-label={t.lp_reset}
                        className="p-3 bg-m3-surfaceContainer/50 rounded-full text-m3-onSurfaceVariant hover:text-m3-error hover:bg-m3-surfaceContainer active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} />
                    </button>
               </div>
          </div>
          
          {/* History Log (Absolute Left) */}
          <div className="absolute top-4 left-6 flex flex-col gap-1 items-start opacity-70 z-40 pointer-events-none">
            {history.map((val, i) => (
                <span key={i} className={`text-sm font-bold tabular-nums animate-in slide-in-from-left fade-in ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {val > 0 ? '+' : ''}{val}
                </span>
            ))}
          </div>
          
          <div className="flex flex-col items-center z-10 select-none mt-10">
            <span className="text-m3-onSurfaceVariant text-xs font-bold tracking-[0.3em] uppercase mb-4 opacity-50">Life Points</span>
            <h1 className={`font-bold text-m3-onSurface tabular-nums leading-none tracking-tighter transition-all duration-300 drop-shadow-2xl ${inputValue !== '0' ? 'opacity-20 scale-90 blur-sm' : 'opacity-100 scale-100'}`} style={{ fontSize: 'min(22vw, 8rem)' }}>
                {lp}
            </h1>
          </div>

          {/* Tools Result Overlay */}
          {toolResult && (
              <div className="absolute top-1/4 z-40 bg-black/80 backdrop-blur-md px-8 py-4 rounded-2xl animate-in zoom-in fade-in duration-300 border border-white/10">
                  <span className="text-3xl font-bold text-white">{toolResult}</span>
              </div>
          )}

          {/* Input Overlay Preview */}
          {inputValue !== '0' && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <span className="text-7xl font-bold text-m3-primary animate-in zoom-in-50 duration-200 drop-shadow-xl">{inputValue}</span>
              </div>
          )}
      </div>

      {/* Calculator Deck */}
      <div className="bg-m3-surfaceContainerHigh rounded-t-[2.5rem] p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.3)] z-30">
          
          {/* Action Bar - Quick Actions Defaults to Damage */}
          <div className="grid grid-cols-4 gap-3 mb-4">
               <button onClick={() => setLp(Math.ceil(lp / 2))} className="bg-m3-surfaceContainer text-m3-onSurfaceVariant rounded-2xl font-bold text-sm py-4 shadow-sm active:scale-95 transition-transform border border-white/5">½</button>
               <button onClick={() => updateLP(-1000)} className="bg-m3-surfaceContainer text-red-400 rounded-2xl font-bold text-sm py-4 shadow-sm active:scale-95 transition-transform border border-white/5">-1000</button>
               <button onClick={() => updateLP(-500)} className="bg-m3-surfaceContainer text-red-400 rounded-2xl font-bold text-sm py-4 shadow-sm active:scale-95 transition-transform border border-white/5">-500</button>
               <button onClick={() => updateLP(-100)} className="bg-m3-surfaceContainer text-red-400 rounded-2xl font-bold text-sm py-4 shadow-sm active:scale-95 transition-transform border border-white/5">-100</button>
          </div>

          {/* Numpad Grid */}
          <div className="grid grid-cols-4 gap-3 h-[42vh] max-h-[360px]">
              {/* Numbers */}
              <div className="col-span-3 grid grid-cols-3 gap-3">
                  {[7,8,9,4,5,6,1,2,3].map(num => (
                      <button 
                        key={num} 
                        onClick={() => handleNumPress(num)}
                        className="bg-m3-background text-m3-onSurface text-2xl font-medium rounded-2xl shadow-sm hover:bg-m3-surfaceContainer active:scale-95 active:bg-m3-primaryContainer active:text-m3-onPrimaryContainer transition-all touch-manipulation border border-white/5"
                      >
                          {num}
                      </button>
                  ))}
                  <button onClick={() => handleNumPress(0)} className="col-span-1 bg-m3-background text-m3-onSurface text-2xl font-medium rounded-2xl shadow-sm hover:bg-m3-surfaceContainer active:scale-95 transition-all border border-white/5">0</button>
                  <button onClick={() => handleNumPress(0)} className="col-span-1 bg-m3-background text-m3-onSurface text-2xl font-medium rounded-2xl shadow-sm hover:bg-m3-surfaceContainer active:scale-95 transition-all border border-white/5">00</button>
                  <button onClick={handleBackspace} className="col-span-1 bg-m3-surfaceContainerLow text-m3-error text-xl font-medium rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center border border-white/5 hover:bg-m3-error/10">
                      <Delete />
                  </button>
              </div>

              {/* Operators - Swapped Positions */}
              <div className="col-span-1 flex flex-col gap-3">
                  {/* Heal (Top) */}
                  <button 
                    onClick={() => applyCustom(1)}
                    className="flex-1 bg-m3-primaryContainer text-m3-onPrimaryContainer rounded-2xl text-lg font-bold flex flex-col items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-md group border border-white/10"
                  >
                      <span className="group-active:scale-125 transition-transform text-3xl mb-1">+</span>
                  </button>

                  {/* Damage (Bottom) */}
                  <button 
                    onClick={() => applyCustom(-1)}
                    className="flex-1 bg-m3-error/20 text-m3-error rounded-2xl text-lg font-bold flex flex-col items-center justify-center hover:bg-m3-error hover:text-m3-onError active:scale-95 transition-all shadow-md group border border-m3-error/20"
                  >
                      <span className="group-active:scale-125 transition-transform text-3xl mb-1">-</span>
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};