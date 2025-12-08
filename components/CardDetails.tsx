import React, { useState } from 'react';
import { CardData, CardType } from '../types';
import { ArrowLeft, Sword, Shield, Star, Zap, Maximize2, X } from 'lucide-react';

interface CardDetailsProps {
  card: CardData;
  onClose: () => void;
}

export const CardDetails: React.FC<CardDetailsProps> = ({ card, onClose }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Determine badge color based on type
  const getTypeColor = () => {
    switch (card.type) {
      case CardType.MONSTER: return 'bg-yugi-monster text-black border-yugi-monster';
      case CardType.SPELL: return 'bg-yugi-spell text-black border-yugi-spell';
      case CardType.TRAP: return 'bg-yugi-trap text-black border-yugi-trap';
      default: return 'bg-m3-secondaryContainer text-m3-onSecondaryContainer border-m3-outline';
    }
  };

  return (
    <div className="relative h-full bg-black animate-in slide-in-from-right duration-300">
        
        {/* Fixed Background Image Layer */}
        <div className="absolute top-0 left-0 w-full h-[55vh] z-0 flex items-start justify-center pt-8 bg-gradient-to-b from-m3-surfaceContainer to-black">
             <div className="absolute inset-0 bg-m3-primary/5 blur-3xl opacity-50" />
             <img 
                src={card.imageUrl} 
                alt={card.name} 
                className="h-[45vh] object-contain drop-shadow-2xl z-0"
             />
             
             {/* Tap hint overlay - Z-Index 30 to be above the scroll container's empty spacer */}
             <button 
                onClick={() => setIsZoomed(true)}
                className="absolute top-[20vh] z-30 bg-black/40 hover:bg-black/60 p-3 rounded-full text-white/90 backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg pointer-events-auto"
             >
                 <Maximize2 size={24} />
             </button>
        </div>

        {/* Navigation Layer (Fixed on top) - Adjusted for Safe Area */}
        <div className="absolute top-0 left-0 w-full z-20 p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-between items-start pointer-events-none">
            <button 
                onClick={onClose}
                className="pointer-events-auto bg-black/40 hover:bg-black/60 text-white rounded-full p-3 backdrop-blur-md transition-colors border border-white/10 shadow-lg"
            >
                <ArrowLeft size={24} />
            </button>
        </div>

        {/* Scrollable Content Layer (Overlaps Image) */}
        <div className="absolute inset-0 z-10 overflow-y-auto no-scrollbar scroll-smooth">
            {/* Spacer to push content down - Events fall through, but we raised zoom button Z-index just in case */}
            <div className="h-[50vh] w-full pointer-events-none" />

            {/* Actual Content */}
            <div className="bg-m3-background min-h-[60vh] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 relative overflow-hidden">
                <div className="p-6 pb-24">
                     {/* Handle Bar */}
                     <div className="w-12 h-1.5 bg-m3-onSurfaceVariant/20 rounded-full mx-auto mb-6" />

                     <div className="mb-6">
                        <h2 className="text-3xl font-bold text-m3-onSurface leading-tight mb-3">{card.name}</h2>
                        <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getTypeColor()}`}>
                            {card.type}
                            </span>
                            {card.race && (
                            <span className="px-3 py-1 rounded-lg text-sm font-medium bg-m3-surfaceContainer text-m3-onSurfaceVariant border border-m3-outline/20">
                                {card.race}
                            </span>
                            )}
                            {card.level && (
                            <span className="px-3 py-1 rounded-lg text-sm font-bold bg-black text-white border border-yugi-gold/50 flex items-center gap-1 shadow-sm">
                                <Star size={14} className="text-yugi-gold fill-yugi-gold" /> {card.level}
                            </span>
                            )}
                        </div>
                    </div>

                    {/* Stats for Monsters */}
                    {card.type === CardType.MONSTER && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-m3-surfaceContainer rounded-2xl p-4 flex items-center gap-3 border border-white/5 shadow-inner">
                            <div className="p-2.5 bg-red-900/30 text-red-300 rounded-full">
                            <Sword size={22} />
                            </div>
                            <div>
                            <p className="text-xs text-m3-onSurfaceVariant font-bold uppercase tracking-wide">ATK</p>
                            <p className="text-xl font-black text-m3-onSurface tabular-nums">{card.atk || '?'}</p>
                            </div>
                        </div>
                        <div className="bg-m3-surfaceContainer rounded-2xl p-4 flex items-center gap-3 border border-white/5 shadow-inner">
                            <div className="p-2.5 bg-blue-900/30 text-blue-300 rounded-full">
                            <Shield size={22} />
                            </div>
                            <div>
                            <p className="text-xs text-m3-onSurfaceVariant font-bold uppercase tracking-wide">DEF</p>
                            <p className="text-xl font-black text-m3-onSurface tabular-nums">{card.def || '?'}</p>
                            </div>
                        </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="bg-m3-surfaceContainer/50 rounded-2xl p-5 border border-m3-outline/10 mb-8">
                        <h3 className="text-sm font-bold text-m3-primary mb-3 flex items-center gap-2 uppercase tracking-wide opacity-80">
                        <Zap size={16} /> Effect / Description
                        </h3>
                        <p className="text-m3-onSurface text-base leading-relaxed whitespace-pre-wrap font-medium opacity-90">
                        {card.description}
                        </p>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className="text-xs text-m3-onSurfaceVariant opacity-50">
                            ID: {card.id.split('-')[0]} • Added: {new Date(card.scanDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Full Screen Zoom Modal */}
        {isZoomed && (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200" onClick={() => setIsZoomed(false)}>
                <button 
                    onClick={() => setIsZoomed(false)}
                    className="absolute top-6 right-6 text-white/80 p-2 bg-white/10 rounded-full z-50 mt-[env(safe-area-inset-top)]"
                >
                    <X size={32} />
                </button>
                <img 
                    src={card.imageUrl} 
                    alt={card.name} 
                    className="w-full h-full object-contain p-2"
                />
            </div>
        )}
    </div>
  );
};