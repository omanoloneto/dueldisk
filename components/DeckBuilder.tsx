import React, { useState } from 'react';
import { Deck, CardData, AppView, Language, CardType } from '../types';
import { Collection } from './Collection';
import { translations } from '../utils/i18n';
import { Plus, Trash, ArrowLeft, Layers, X, Wand2, Loader2, Check, AlertTriangle, Box, ChevronRight, Ghost } from 'lucide-react';
import { generateDeck, searchCardByName } from '../services/geminiService';

interface DeckBuilderProps {
  decks: Deck[];
  allCards: CardData[];
  onCreateDeck: (name: string, mainCards: CardData[], extraCards?: CardData[], sideCards?: CardData[]) => void;
  onUpdateDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string) => void;
  onChangeView: (view: AppView) => void;
  lang: Language;
}

type DeckTab = 'MAIN' | 'EXTRA' | 'SIDE';

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  decks,
  allCards,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck,
  onChangeView,
  lang
}) => {
  const t = translations[lang];
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DeckTab>('MAIN');
  
  // Manual Create State
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [showCardSelector, setShowCardSelector] = useState(false);

  // AI Wizard State
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1);
  const [aiCoreCards, setAiCoreCards] = useState<CardData[]>([]);
  const [aiMode, setAiMode] = useState<'OWNED' | 'UNLIMITED'>('OWNED');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeDeck = decks.find(d => d.id === activeDeckId);

  const getCardObjects = (ids: string[] = []) => {
      return ids.map(id => allCards.find(c => c.id === id)).filter(Boolean) as CardData[];
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeckName.trim()) {
      onCreateDeck(newDeckName.trim(), []);
      setNewDeckName('');
      setIsCreating(false);
    }
  };

  const removeCardFromDeck = (indexToRemove: number) => {
    if (!activeDeck) return;
    
    let updatedDeck = { ...activeDeck };
    
    if (activeTab === 'MAIN') {
        const newIds = [...activeDeck.cards];
        newIds.splice(indexToRemove, 1);
        updatedDeck.cards = newIds;
    } else if (activeTab === 'EXTRA') {
        const newIds = [...(activeDeck.extraDeck || [])];
        newIds.splice(indexToRemove, 1);
        updatedDeck.extraDeck = newIds;
    } else {
        const newIds = [...(activeDeck.sideDeck || [])];
        newIds.splice(indexToRemove, 1);
        updatedDeck.sideDeck = newIds;
    }

    onUpdateDeck(updatedDeck);
  };

  const addCardToDeck = (card: CardData) => {
    if (!activeDeck) return;
    
    let updatedDeck = { ...activeDeck };
    
    if (activeTab === 'MAIN') {
        if (activeDeck.cards.length >= 60) { alert("Main Deck Full (60)!"); return; }
        updatedDeck.cards = [...activeDeck.cards, card.id];
    } else if (activeTab === 'EXTRA') {
        const currentExtra = activeDeck.extraDeck || [];
        if (currentExtra.length >= 15) { alert("Extra Deck Full (15)!"); return; }
        updatedDeck.extraDeck = [...currentExtra, card.id];
    } else {
        const currentSide = activeDeck.sideDeck || [];
        if (currentSide.length >= 15) { alert("Side Deck Full (15)!"); return; }
        updatedDeck.sideDeck = [...currentSide, card.id];
    }

    onUpdateDeck(updatedDeck);
    setShowCardSelector(false);
  };

  // AI Logic
  const toggleAiCoreCard = (card: CardData) => {
      setAiCoreCards(prev => {
          const exists = prev.find(c => c.id === card.id);
          if (exists) return prev.filter(c => c.id !== card.id);
          return [...prev, card];
      });
  };

  const runAiGeneration = async () => {
      if (aiCoreCards.length === 0) return;
      
      setIsGenerating(true);
      try {
          const coreNames = aiCoreCards.map(c => c.name);
          const collectionNames = allCards.map(c => c.name);

          const result = await generateDeck(coreNames, aiMode, collectionNames);
          
          let mainCards: CardData[] = [];
          let extraCards: CardData[] = [];
          
          const processCardList = async (names: string[], targetList: CardData[]) => {
              for (const name of names) {
                const ownedCard = allCards.find(c => c.name.toLowerCase() === name.toLowerCase());
                if (ownedCard) {
                    targetList.push(ownedCard);
                } else if (aiMode === 'UNLIMITED') {
                    const apiResults = await searchCardByName(name);
                    if (apiResults && apiResults.length > 0) {
                        const res = apiResults[0];
                        const newProxyCard: CardData = {
                            id: crypto.randomUUID(),
                            name: res.name || name,
                            type: res.type || CardType.UNKNOWN,
                            description: res.description || '',
                            atk: res.atk,
                            def: res.def,
                            level: res.level,
                            imageUrl: res.imageUrl,
                            scanDate: Date.now(),
                            isOwned: false
                        };
                        targetList.push(newProxyCard);
                    }
                }
              }
          };

          await processCardList(result.mainDeck, mainCards);
          if (result.extraDeck) {
              await processCardList(result.extraDeck, extraCards);
          }
          
          onCreateDeck(result.deckName, mainCards, extraCards);
          setShowAiWizard(false);
          setAiStep(1);
          setAiCoreCards([]);
          setAiMode('OWNED');
          alert(t.ai_success);
      } catch (e) {
          alert(t.ai_error);
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  // Helper stats for Main Deck
  const getDeckStats = (cards: CardData[]) => {
      const monsters = cards.filter(c => c.type === CardType.MONSTER).length;
      const spells = cards.filter(c => c.type === CardType.SPELL).length;
      const traps = cards.filter(c => c.type === CardType.TRAP).length;
      return { monsters, spells, traps };
  };

  // --- View: List of Decks ---
  if (!activeDeckId) {
    if (showAiWizard) {
        const canUseOwnedMode = allCards.length >= 40;

        return (
            <div className="flex flex-col h-full bg-m3-background p-4 animate-in slide-in-from-right">
                <div className="flex items-center gap-4 mb-4 shrink-0">
                    <button onClick={() => setShowAiWizard(false)} className="p-2"><ArrowLeft /></button>
                    <h2 className="text-2xl font-bold text-m3-onSurface">{t.ai_wizard_title}</h2>
                </div>

                {isGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <Loader2 size={48} className="animate-spin text-m3-primary mb-4" />
                        <h3 className="text-xl font-bold mb-2">{t.ai_generating}</h3>
                        <p className="text-m3-onSurfaceVariant">Isso pode levar alguns segundos...</p>
                    </div>
                ) : (
                    <>
                    {aiStep === 1 && (
                        <div className="flex-1 flex flex-col relative min-h-0">
                            <h3 className="text-lg font-bold mb-2 shrink-0">{t.ai_select_core} ({aiCoreCards.length})</h3>
                            <div className="flex-1 overflow-hidden border border-m3-outline/20 rounded-xl relative min-h-0">
                                <Collection 
                                    cards={allCards}
                                    lang={lang}
                                    onDeleteCard={()=>{}}
                                    onAddCard={()=>{}}
                                    selectionMode={true}
                                    onSelectCard={toggleAiCoreCard}
                                />
                            </div>
                            
                            <div className="py-3 h-28 overflow-x-auto flex gap-2 shrink-0 border-t border-m3-outline/10 mt-2">
                                {aiCoreCards.length === 0 && (
                                    <div className="w-full flex items-center justify-center text-m3-onSurfaceVariant text-sm border-2 border-dashed border-m3-outline/20 rounded-xl bg-m3-surfaceContainerLow">
                                        Select at least 1 card
                                    </div>
                                )}
                                {aiCoreCards.map(c => (
                                    <div key={c.id} className="h-full aspect-[2/3] bg-black rounded-lg overflow-hidden relative border border-m3-primary shrink-0 animate-in zoom-in">
                                        <img src={c.imageUrl} className="w-full h-full object-cover opacity-80" />
                                        <button onClick={() => toggleAiCoreCard(c)} className="absolute inset-0 flex items-center justify-center text-white bg-black/30"><X size={20}/></button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-2 shrink-0">
                                <button 
                                    onClick={() => aiCoreCards.length > 0 && setAiStep(2)}
                                    disabled={aiCoreCards.length === 0}
                                    className="w-full bg-m3-primary text-m3-onPrimary py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all shadow-lg active:scale-95"
                                >
                                    {t.ai_next_step} <ChevronRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {aiStep === 2 && (
                        <div className="flex-1 flex flex-col gap-4 animate-in slide-in-from-right overflow-y-auto">
                            <h3 className="text-lg font-bold">{t.ai_mode_title}</h3>
                            
                            <button 
                                onClick={() => canUseOwnedMode && setAiMode('OWNED')} 
                                disabled={!canUseOwnedMode}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${aiMode === 'OWNED' ? 'border-m3-primary bg-m3-primaryContainer/30' : 'border-m3-outline/20'} ${!canUseOwnedMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-lg">{t.ai_mode_owned}</span>
                                    {aiMode === 'OWNED' && <Check className="text-m3-primary"/>}
                                </div>
                                <p className="text-sm text-m3-onSurfaceVariant">{t.ai_mode_owned_desc}</p>
                                {!canUseOwnedMode && (
                                    <div className="flex items-center gap-2 mt-2 text-m3-error text-xs font-bold">
                                        <AlertTriangle size={14} /> Need 40+ cards in Trunk ({allCards.length}/40)
                                    </div>
                                )}
                            </button>

                            <button onClick={() => setAiMode('UNLIMITED')} className={`p-4 rounded-xl border-2 text-left transition-all ${aiMode === 'UNLIMITED' ? 'border-m3-primary bg-m3-primaryContainer/30' : 'border-m3-outline/20'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-lg">{t.ai_mode_unlimited}</span>
                                    {aiMode === 'UNLIMITED' && <Check className="text-m3-primary"/>}
                                </div>
                                <p className="text-sm text-m3-onSurfaceVariant">{t.ai_mode_unlimited_desc}</p>
                            </button>

                            <div className="mt-auto">
                                <button 
                                    onClick={runAiGeneration}
                                    className="w-full bg-m3-primary text-m3-onPrimary py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                                >
                                    <Wand2 /> {t.deck_create}
                                </button>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>
        );
    }

    return (
      <div className="flex flex-col h-full bg-m3-background p-4">
        <div className="flex justify-between items-center mb-6 mt-4 shrink-0">
          <h2 className="text-3xl font-normal text-m3-onSurface">{t.nav_decks}</h2>
          <div className="flex gap-2">
            <button 
                onClick={() => setShowAiWizard(true)}
                className="w-14 h-14 bg-m3-tertiary text-black rounded-2xl shadow-lg hover:brightness-110 flex items-center justify-center transition-all active:scale-95"
            >
                <Wand2 size={24} />
            </button>
            <button 
                onClick={() => setIsCreating(true)}
                className="w-14 h-14 bg-m3-primaryContainer text-m3-onPrimaryContainer rounded-2xl shadow-lg hover:brightness-110 flex items-center justify-center transition-all active:scale-95"
            >
                <Plus size={28} />
            </button>
          </div>
        </div>

        {isCreating && (
          <div className="mb-6 bg-m3-surfaceContainer p-4 rounded-xl animate-in fade-in slide-in-from-top-4 shrink-0">
            <h3 className="text-m3-onSurface font-medium mb-3">{t.deck_new}</h3>
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
              <input 
                autoFocus
                type="text" 
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="bg-m3-surfaceContainerHigh border border-m3-outline/30 rounded-lg px-4 py-3 text-m3-onSurface focus:ring-2 focus:ring-m3-primary focus:outline-none"
                placeholder={t.deck_name}
              />
              <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setIsCreating(false)} className="text-m3-primary font-medium px-4 py-2">{t.deck_cancel}</button>
                  <button type="submit" className="bg-m3-primary text-m3-onPrimary px-6 py-2 rounded-full font-medium">{t.deck_create}</button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-20 min-h-0">
            <div className="grid grid-cols-2 gap-4">
                {decks.length === 0 && !isCreating && (
                    <p className="col-span-2 text-center text-m3-onSurfaceVariant mt-10">{t.deck_empty}</p>
                )}
                {decks.map(deck => (
                    <div 
                    key={deck.id} 
                    onClick={() => setActiveDeckId(deck.id)}
                    className="bg-m3-surfaceContainerLow rounded-xl overflow-hidden cursor-pointer group active:scale-95 transition-all shadow-md relative aspect-[3/4] flex flex-col"
                    >
                    <div className="flex-1 bg-gradient-to-br from-m3-surfaceContainerHigh to-m3-surfaceContainer relative">
                        {(() => {
                                const firstCard = allCards.find(c => c.id === deck.cards[0]);
                                return firstCard?.imageUrl ? (
                                    <>
                                        <img src={firstCard.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-20"><Box size={48} /></div>
                                );
                        })()}
                        
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
                            {deck.cards.length}
                        </div>
                    </div>

                    <div className="p-3 bg-m3-surfaceContainer">
                        <h3 className="font-bold text-sm text-m3-onSurface truncate">{deck.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-m3-onSurfaceVariant uppercase tracking-wider">Deck Box</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteDeck(deck.id); }}
                                className="text-m3-onSurfaceVariant hover:text-m3-error"
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                    </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  // --- View: Add Card Overlay ---
  if (showCardSelector) {
    return (
      <div className="fixed inset-0 z-50 bg-m3-background flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="p-4 border-b border-m3-outline/20 flex justify-between items-center bg-m3-surfaceContainer shrink-0">
              <h3 className="font-bold text-m3-onSurface text-lg">{t.col_add_title} ({activeTab})</h3>
              <button onClick={() => setShowCardSelector(false)} className="p-2 text-m3-onSurfaceVariant"><X /></button>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
             <Collection 
                cards={allCards} 
                onDeleteCard={() => {}} 
                onAddCard={() => {}}
                selectionMode={true}
                onAddToDeck={addCardToDeck}
                lang={lang}
             />
          </div>
      </div>
    );
  }

  // --- View: Single Deck Editor ---
  const activeDeckMain = getCardObjects(activeDeck.cards);
  const activeDeckExtra = getCardObjects(activeDeck.extraDeck);
  const activeDeckSide = getCardObjects(activeDeck.sideDeck);

  const currentDisplayCards = activeTab === 'MAIN' ? activeDeckMain : (activeTab === 'EXTRA' ? activeDeckExtra : activeDeckSide);
  const stats = getDeckStats(activeDeckMain);

  return (
    <div className="flex flex-col h-full bg-m3-background">
      {/* Sticky Header with Stats */}
      <div className="bg-m3-surfaceContainer shadow-sm sticky top-0 z-10 shrink-0">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => { setActiveDeckId(null); setActiveTab('MAIN'); }} className="text-m3-onSurface p-1 rounded-full hover:bg-black/10">
                <ArrowLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-m3-onSurface truncate leading-tight">{activeDeck.name}</h2>
                <div className="flex gap-3 text-xs font-medium text-m3-onSurfaceVariant mt-0.5">
                    <span className="text-yugi-monster font-bold">{stats.monsters} Mon</span>
                    <span className="text-yugi-spell font-bold">{stats.spells} Spell</span>
                    <span className="text-yugi-trap font-bold">{stats.traps} Trap</span>
                </div>
            </div>
            <button 
                onClick={() => { setActiveDeckId(null); setActiveTab('MAIN'); }}
                className="bg-m3-primary text-m3-onPrimary p-2 rounded-full shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
                <Check size={20} />
            </button>
          </div>

          {/* Material 3 Tabs */}
          <div className="flex flex-row w-full border-b border-m3-outline/20">
              <button 
                onClick={() => setActiveTab('MAIN')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative overflow-hidden ${activeTab === 'MAIN' ? 'border-m3-primary text-m3-primary' : 'border-transparent text-m3-onSurfaceVariant hover:text-m3-onSurface'}`}
              >
                  Main ({activeDeckMain.length})
              </button>
              <button 
                onClick={() => setActiveTab('EXTRA')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative overflow-hidden ${activeTab === 'EXTRA' ? 'border-m3-primary text-m3-primary' : 'border-transparent text-m3-onSurfaceVariant hover:text-m3-onSurface'}`}
              >
                  Extra ({activeDeckExtra.length})
              </button>
              <button 
                onClick={() => setActiveTab('SIDE')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative overflow-hidden ${activeTab === 'SIDE' ? 'border-m3-primary text-m3-primary' : 'border-transparent text-m3-onSurfaceVariant hover:text-m3-onSurface'}`}
              >
                  Side ({activeDeckSide.length})
              </button>
          </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-2 pb-24 min-h-0">
        {currentDisplayCards.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-m3-onSurfaceVariant opacity-50 animate-in fade-in">
               <Layers size={48} className="mb-2" />
               <p>{t.deck_empty}</p>
               <span className="text-xs mt-1 bg-m3-surfaceContainerHigh px-2 py-1 rounded">
                   Tab: {activeTab}
               </span>
           </div>
        ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                {currentDisplayCards.map((card, index) => (
                    <div 
                        key={`${card.id}-${index}-${activeTab}`} 
                        className="aspect-[2/3] relative rounded overflow-hidden group border border-m3-outline/20 shadow-sm bg-black"
                        onClick={() => removeCardFromDeck(index)}
                    >
                        {card.imageUrl ? (
                            <img src={card.imageUrl} className={`w-full h-full object-cover ${card.isOwned === false ? 'opacity-50 grayscale' : ''}`} />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center p-1 text-[8px] text-center text-white break-words">
                                 {card.name}
                             </div>
                        )}
                        
                        {/* Missing/Ghost Indicator */}
                        {card.isOwned === false && (
                            <div className="absolute top-1 left-1 bg-m3-error text-m3-onError rounded-full p-1 z-10 shadow-md">
                                <Ghost size={12} />
                            </div>
                        )}
                        
                        {/* Remove Overlay */}
                        <div className="absolute inset-0 bg-red-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                            <Trash className="text-white" size={20} />
                        </div>

                        {/* Type Strip */}
                        <div className={`absolute bottom-0 inset-x-0 h-1 ${
                            card.type === CardType.MONSTER ? 'bg-yugi-monster' : 
                            card.type === CardType.SPELL ? 'bg-yugi-spell' : 
                            card.type === CardType.TRAP ? 'bg-yugi-trap' : 'bg-gray-500'
                        }`} />
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button 
          onClick={() => setShowCardSelector(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-m3-primaryContainer text-m3-onPrimaryContainer rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform z-20"
      >
          <Plus size={32} />
      </button>
    </div>
  );
};