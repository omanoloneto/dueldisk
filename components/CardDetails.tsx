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
      case CardType.MONSTER: return 'bg-yugi-monster text-black';
      case CardType.SPELL: return 'bg-yugi-spell text-black';
      case CardType.TRAP: return 'bg-yugi-trap text-black';
      default: return 'bg-m3-secondaryContainer text-m3-onSecondaryContainer';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-m3-surfaceContainerHigh w-full max-w-md max-h-[90vh] rounded-[28px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative bg-black h-72 shrink-0 flex items-center justify-center">
          <img 
            src={card.imageUrl} 
            alt={card.name} 
            className="h-full object-contain drop-shadow-lg"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-md transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold text-m3-onSurface leading-tight">{card.name}</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor()}`}>
              {card.type}
            </span>
            {card.race && (
              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-m3-surfaceContainer text-m3-onSurfaceVariant border border-m3-outline/20">
                {card.race}
              </span>
            )}
            {card.level && (
              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-black text-white border border-m3-outline/20 flex items-center gap-1">
                <Star size={14} className="text-yugi-gold fill-yugi-gold" /> {card.level}
              </span>
            )}
          </div>

          {/* Stats for Monsters */}
          {card.type === CardType.MONSTER && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-m3-surfaceContainer rounded-2xl p-3 flex items-center gap-3">
                <div className="p-2 bg-red-900/30 text-red-300 rounded-full">
                  <Sword size={20} />
                </div>
                <div>
                  <p className="text-xs text-m3-onSurfaceVariant">ATK</p>
                  <p className="text-lg font-bold text-m3-onSurface">{card.atk || '?'}</p>
                </div>
              </div>
              <div className="bg-m3-surfaceContainer rounded-2xl p-3 flex items-center gap-3">
                <div className="p-2 bg-blue-900/30 text-blue-300 rounded-full">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-xs text-m3-onSurfaceVariant">DEF</p>
                  <p className="text-lg font-bold text-m3-onSurface">{card.def || '?'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-m3-surfaceContainer rounded-2xl p-4">
            <h3 className="text-sm font-medium text-m3-primary mb-2 flex items-center gap-2">
              <Zap size={16} /> Effect / Description
            </h3>
            <p className="text-m3-onSurface text-sm leading-relaxed whitespace-pre-wrap">
              {card.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};