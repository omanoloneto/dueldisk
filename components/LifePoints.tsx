import React, { useState } from 'react';
import { RefreshCw, Delete, History } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/i18n';

interface LifePointsProps {
  lang: Language;
}

export const LifePoints: React.FC<LifePointsProps> = ({ lang }) => {
  const [lp, setLp] = useState(8000);
  const [inputValue, setInputValue] = useState('0');
  const [history, setHistory] = useState<number[]>([]);
  const t = translations[lang];

  const triggerHaptic = () => {
      if (navigator.vibrate) navigator.vibrate(10);
  };

  const updateLP = (amount: number) => {
    setHistory(prev => [amount, ...prev].slice(0, 3)); // Keep last 3
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

  const reset = () => {
    if (confirm(t.lp_reset + "?")) {
      setLp(8000);
      setInputValue('0');
      setHistory([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-m3-background">
      {/* LP Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-m3-surfaceContainerLow transition-colors duration-300">
          
          {/* History Log (Floating) */}
          <div className="absolute top-4 left-6 flex flex-col gap-1 items-start opacity-60">
             {history.map((val, i) => (
                 <span key={i} className={`text-sm font-bold ${val > 0 ? 'text-m3-primary' : 'text-m3-error'}`}>
                     {val > 0 ? '+' : ''}{val}
                 </span>
             ))}
          </div>

          <button onClick={reset} className="absolute top-4 right-4 p-3 bg-m3-surfaceContainer/50 rounded-full text-m3-onSurfaceVariant hover:text-m3-error transition-all active:scale-90">
             <RefreshCw size={20} />
          </button>
          
          <div className="flex flex-col items-center z-10">
            <span className="text-m3-onSurfaceVariant text-xs font-bold tracking-[0.2em] uppercase mb-2">Life Points</span>
            <h1 className={`font-bold text-m3-onSurface tabular-nums leading-none tracking-tighter transition-all duration-300 ${inputValue !== '0' ? 'opacity-30 scale-90' : 'opacity-100 scale-100'}`} style={{ fontSize: 'min(20vw, 7rem)' }}>
                {lp}
            </h1>
          </div>

          {/* Input Overlay Preview */}
          {inputValue !== '0' && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <span className="text-6xl font-bold text-m3-primary animate-in zoom-in-50 duration-200">{inputValue}</span>
              </div>
          )}
      </div>

      {/* Calculator Deck */}
      <div className="bg-m3-surfaceContainerHigh rounded-t-[2rem] p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
          
          {/* Action Bar */}
          <div className="grid grid-cols-4 gap-3 mb-3">
               <button onClick={() => setLp(Math.ceil(lp / 2))} className="bg-m3-surfaceContainer text-m3-onSurfaceVariant rounded-xl font-bold text-sm py-3">½</button>
               <button onClick={() => updateLP(1000)} className="bg-m3-surfaceContainer text-m3-onSurface rounded-xl font-bold text-sm py-3">+1000</button>
               <button onClick={() => updateLP(500)} className="bg-m3-surfaceContainer text-m3-onSurface rounded-xl font-bold text-sm py-3">+500</button>
               <button onClick={() => updateLP(100)} className="bg-m3-surfaceContainer text-m3-onSurface rounded-xl font-bold text-sm py-3">+100</button>
          </div>

          {/* Numpad Grid */}
          <div className="grid grid-cols-4 gap-3 h-[45vh] max-h-[380px]">
              {/* Numbers */}
              <div className="col-span-3 grid grid-cols-3 gap-3">
                  {[7,8,9,4,5,6,1,2,3].map(num => (
                      <button 
                        key={num} 
                        onClick={() => handleNumPress(num)}
                        className="bg-m3-background text-m3-onSurface text-3xl font-medium rounded-2xl shadow-sm hover:bg-m3-surfaceContainer active:scale-95 active:bg-m3-primaryContainer active:text-m3-onPrimaryContainer transition-all touch-manipulation"
                      >
                          {num}
                      </button>
                  ))}
                  <button onClick={() => handleNumPress(0)} className="col-span-1 bg-m3-background text-m3-onSurface text-3xl font-medium rounded-2xl shadow-sm hover:bg-m3-surfaceContainer active:scale-95 transition-all">0</button>
                  <button onClick={() => handleNumPress(0)} className="col-span-1 bg-m3-background text-m3-onSurface text-3xl font-medium rounded-2xl shadow-sm hover:bg-m3-surfaceContainer active:scale-95 transition-all">00</button>
                  <button onClick={handleBackspace} className="col-span-1 bg-m3-surfaceContainerLow text-m3-error text-xl font-medium rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center">
                      <Delete />
                  </button>
              </div>

              {/* Operators */}
              <div className="col-span-1 flex flex-col gap-3">
                  <button 
                    onClick={() => applyCustom(-1)}
                    className="flex-1 bg-m3-error text-m3-onError rounded-2xl text-lg font-bold flex flex-col items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-md group"
                  >
                      <span className="group-active:scale-125 transition-transform text-3xl mb-1">-</span>
                      <span className="text-xs uppercase opacity-80">{t.lp_damage}</span>
                  </button>
                  <button 
                    onClick={() => applyCustom(1)}
                    className="flex-1 bg-m3-primary text-m3-onPrimary rounded-2xl text-lg font-bold flex flex-col items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-md group"
                  >
                      <span className="group-active:scale-125 transition-transform text-3xl mb-1">+</span>
                      <span className="text-xs uppercase opacity-80">{t.lp_heal}</span>
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};