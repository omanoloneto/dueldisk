import React from 'react';
import { CardData, CardType } from '../types';
import { X, Sword, Shield, Star, Zap } from 'lucide-react';

interface CardDetailsProps {
  card: CardData;
  onClose: () => void;
}

export const CardDetails: React.FC<CardDetailsProps> = ({ card, onClose }) => {
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-m3-surfaceContainerHigh w-full max-w-md max-h-[85vh] rounded-[28px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative bg-black/50 h-80 shrink-0 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-m3-surfaceContainer opacity-50 blur-3xl"></div>
          <img 
            src={card.imageUrl} 
            alt={card.name} 
            className="h-full object-contain drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-300"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 backdrop-blur-md transition-colors z-20 border border-white/10"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-gradient-to-b from-m3-surfaceContainerHigh to-m3-surfaceContainer">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-m3-onSurface leading-tight mb-2">{card.name}</h2>
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
          <div className="bg-m3-surfaceContainer/80 rounded-2xl p-5 border border-m3-outline/10">
            <h3 className="text-sm font-bold text-m3-primary mb-3 flex items-center gap-2 uppercase tracking-wide opacity-80">
              <Zap size={16} /> Effect / Description
            </h3>
            <p className="text-m3-onSurface text-sm leading-relaxed whitespace-pre-wrap font-medium opacity-90">
              {card.description}
            </p>
          </div>
          
          <div className="mt-8 text-center opacity-30">
              <div className="h-1 w-12 bg-m3-onSurface mx-auto rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};