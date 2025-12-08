import React, { useMemo, useState, useEffect, useRef } from 'react';
import { CardData, CardType, Language } from '../types';
import { Scanner } from './Scanner';
import { searchCardByName, searchCardByCode } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { Search, Trash2, PlusCircle, Plus, Camera, Type, Hash, X, Loader2, ArrowUpDown, Minus, Check } from 'lucide-react';

interface CollectionProps {
  cards: CardData[];
  onDeleteCard: (id: string, quantity: number) => void;
  onAddCard: (card: CardData) => void;
  onAddToDeck?: (card: CardData) => void; 
  onSelectCard?: (card: CardData) => void;
  selectionMode?: boolean;
  lang: Language;
}

type SortOption = 'NEWEST' | 'NAME' | 'ATK';
type FilterOption = 'ALL' | 'MONSTER' | 'SPELL' | 'TRAP' | 'FUSION' | 'SYNCHRO' | 'XYZ' | 'LINK' | 'RITUAL';

export const Collection: React.FC<CollectionProps> = ({ 
  cards, 
  onDeleteCard, 
  onAddCard,
  onAddToDeck,
  onSelectCard,
  selectionMode = false,
  lang
}) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [sort, setSort] = useState<SortOption>('NEWEST');
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<'NONE' | 'SCAN' | 'SEARCH_NAME' | 'SEARCH_CODE'>('NONE');
  
  // Search State
  const [apiQuery, setApiQuery] = useState('');
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiResults, setApiResults] = useState<Partial<CardData>[]>([]);
  
  // Selection State for Adding
  const [selectedApiCard, setSelectedApiCard] = useState<Partial<CardData> | null>(null);
  const [addQuantity, setAddQuantity] = useState(1);

  // Delete Modal State
  const [cardToDelete, setCardToDelete] = useState<CardData | null>(null);
  const [deleteQuantity, setDeleteQuantity] = useState(1);

  // Long Press Refs
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const filteredCards = useMemo(() => {
    let result = cards.filter(c => {
      // ONLY SHOW OWNED CARDS IN COLLECTION VIEW
      if (c.isOwned === false) return false;

      // Filter Logic
      let typeMatch = true;
      const lowerDesc = (c.description || '').toLowerCase();
      const lowerRace = (c.race || '').toLowerCase();
      const lowerName = (c.name || '').toLowerCase();
      const combined = lowerName + " " + lowerRace + " " + lowerDesc;

      if (filter === 'MONSTER') typeMatch = c.type === CardType.MONSTER;
      else if (filter === 'SPELL') typeMatch = c.type === CardType.SPELL;
      else if (filter === 'TRAP') typeMatch = c.type === CardType.TRAP;
      else if (filter === 'FUSION') typeMatch = combined.includes('fusion') && c.type === CardType.MONSTER;
      else if (filter === 'SYNCHRO') typeMatch = combined.includes('synchro') && c.type === CardType.MONSTER;
      else if (filter === 'XYZ') typeMatch = combined.includes('xyz') && c.type === CardType.MONSTER;
      else if (filter === 'LINK') typeMatch = combined.includes('link') && c.type === CardType.MONSTER;
      else if (filter === 'RITUAL') typeMatch = combined.includes('ritual') && c.type === CardType.MONSTER;

      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && matchesSearch;
    });

    // Sorting Logic
    return result.sort((a, b) => {
        if (sort === 'NEWEST') return b.scanDate - a.scanDate;
        if (sort === 'NAME') return a.name.localeCompare(b.name);
        if (sort === 'ATK') {
            const atk1 = parseInt(a.atk || '0') || 0;
            const atk2 = parseInt(b.atk || '0') || 0;
            return atk2 - atk1;
        }
        return 0;
    });
  }, [cards, filter, searchTerm, sort]);

  // Debounced Search Effect
  useEffect(() => {
    if (addMethod !== 'SEARCH_NAME') return;
    if (apiQuery.length < 3) {
        setApiResults([]);
        return;
    }

    const timeoutId = setTimeout(() => {
        handleApiSearch();
    }, 600); // 600ms debounce

    return () => clearTimeout(timeoutId);
  }, [apiQuery, addMethod]);

  const handleApiSearch = async () => {
      if(!apiQuery) return;
      setIsSearchingApi(true);
      setSelectedApiCard(null); // Reset selection on new search
      try {
          let results = [];
          if (addMethod === 'SEARCH_CODE') {
              results = await searchCardByCode(apiQuery);
          } else {
              results = await searchCardByName(apiQuery);
          }
          setApiResults(results);
      } catch(e) {
          console.error(e);
      } finally {
          setIsSearchingApi(false);
      }
  };

  const confirmAddFromApi = () => {
      if (!selectedApiCard) return;

      const newCard: CardData = {
          id: crypto.randomUUID(),
          name: selectedApiCard.name || 'Unknown',
          type: selectedApiCard.type || CardType.UNKNOWN,
          description: selectedApiCard.description || '',
          atk: selectedApiCard.atk,
          def: selectedApiCard.def,
          level: selectedApiCard.level,
          race: selectedApiCard.race,
          imageUrl: selectedApiCard.imageUrl,
          scanDate: Date.now(),
          isOwned: true,
          quantity: addQuantity
      };
      onAddCard(newCard);
      setIsAddModalOpen(false);
      
      // Reset State
      setAddMethod('NONE');
      setApiQuery('');
      setApiResults([]);
      setSelectedApiCard(null);
      setAddQuantity(1);
  };

  const closeAddModal = () => {
      setIsAddModalOpen(false); 
      setAddMethod('NONE'); 
      setApiQuery(''); 
      setApiResults([]);
      setSelectedApiCard(null);
      setAddQuantity(1);
  };

  // --- Long Press Logic ---
  const handleTouchStart = (card: CardData) => {
    isLongPressRef.current = false;
    longPressTimer.current = setTimeout(() => {
        isLongPressRef.current = true;
        setCardToDelete(card);
        setDeleteQuantity(1);
    }, 600); // 600ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  const handleCardClick = (card: CardData) => {
      if (isLongPressRef.current) return; // Prevent click if long press happened
      
      if (selectionMode && onAddToDeck) {
        onAddToDeck(card);
      } else if (onSelectCard) {
        onSelectCard(card);
      }
  };

  const handleDeleteConfirm = () => {
      if (cardToDelete) {
          onDeleteCard(cardToDelete.id, deleteQuantity);
          setCardToDelete(null);
          setDeleteQuantity(1);
      }
  };

  return (
    <div className="flex flex-col h-full bg-m3-background relative">
      
      {/* Classic Top Bar with Safe Area Top */}
      <div className="bg-m3-surfaceContainer shadow-sm sticky top-0 z-20 flex flex-col pt-[env(safe-area-inset-top)]">
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/5">
            {showSearch ? (
                <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-right fade-in duration-200">
                    <Search className="text-m3-primary" size={20} />
                    <input 
                        autoFocus
                        type="text" 
                        placeholder={t.col_search_placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-m3-onSurface placeholder-m3-onSurfaceVariant/50 outline-none text-lg"
                    />
                    <button onClick={() => { setShowSearch(false); setSearchTerm(''); }} className="p-2 text-m3-onSurfaceVariant hover:text-m3-onSurface">
                        <X size={20} />
                    </button>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-medium text-m3-onSurface">
                         {selectionMode ? t.action_add : t.nav_collection}
                    </h2>
                    <div className="flex gap-2">
                         <button onClick={() => setShowSearch(true)} className="p-2.5 rounded-full hover:bg-m3-surfaceContainerHigh text-m3-onSurfaceVariant hover:text-m3-onSurface transition-colors">
                             <Search size={20} />
                         </button>
                         {!selectionMode && (
                             <button 
                               onClick={() => setSort(prev => prev === 'NEWEST' ? 'NAME' : (prev === 'NAME' ? 'ATK' : 'NEWEST'))}
                               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-m3-surfaceContainerHigh text-m3-onSurfaceVariant text-xs font-bold uppercase hover:bg-m3-secondaryContainer hover:text-m3-onSecondaryContainer transition-colors"
                             >
                                 <ArrowUpDown size={14} /> {sort}
                             </button>
                         )}
                    </div>
                </>
            )}
        </div>

        {/* Filter Chips - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar border-b border-white/5">
          {['ALL', 'MONSTER', 'SPELL', 'TRAP', 'FUSION', 'SYNCHRO', 'XYZ', 'LINK', 'RITUAL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as FilterOption)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                filter === type 
                  ? 'bg-m3-primaryContainer text-m3-onPrimaryContainer border-m3-primaryContainer' 
                  : 'bg-transparent text-m3-onSurfaceVariant border-m3-outline/30 hover:bg-m3-surfaceContainerHigh'
              }`}
            >
              {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 safe-pb">
        {filteredCards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-m3-onSurfaceVariant">
            <p>{t.col_empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-24 select-none">
            {filteredCards.map((card) => (
              <div 
                key={card.id} 
                onTouchStart={() => handleTouchStart(card)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(card)} // Support desktop mouse long press too
                onMouseUp={handleTouchEnd}
                onClick={() => handleCardClick(card)}
                className="bg-m3-surfaceContainerLow rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group aspect-[2/3] border border-m3-outline/10 active:scale-95 duration-100"
              >
                 {card.imageUrl ? (
                     <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover pointer-events-none" />
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-m3-onSurfaceVariant bg-m3-surfaceContainerHigh p-1 text-center leading-tight">
                        <span className="font-bold">{card.name}</span>
                     </div>
                 )}
                 
                 {/* Type Indicator Dot */}
                 <div className={`absolute top-1 right-1 w-2 h-2 rounded-full z-10 shadow-sm ${
                     card.type === CardType.MONSTER ? 'bg-yugi-monster' : 
                     card.type === CardType.SPELL ? 'bg-yugi-spell' : 
                     card.type === CardType.TRAP ? 'bg-yugi-trap' : 'bg-gray-500'
                 }`} />

                 {/* Quantity Badge */}
                 {(card.quantity || 1) > 0 && (
                     <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md border border-white/10 font-bold z-10 shadow-sm">
                         x{card.quantity || 1}
                     </div>
                 )}

                 {selectionMode && (
                      <div className="absolute inset-0 bg-m3-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <PlusCircle size={32} className="text-m3-onPrimaryContainer bg-m3-primaryContainer rounded-full shadow-lg" />
                      </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB (Only in normal collection mode) */}
      {!selectionMode && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-m3-primaryContainer text-m3-onPrimaryContainer rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform z-20"
          >
              <Plus size={32} />
          </button>
      )}

      {/* Add Card Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[env(safe-area-inset-top)]">
              <div className="bg-m3-surfaceContainer w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom shadow-2xl overflow-hidden relative">
                  {/* Header */}
                  <div className="p-4 border-b border-m3-outline/10 flex justify-between items-center shrink-0">
                      <h3 className="text-xl font-normal text-m3-onSurface">{t.col_add_title}</h3>
                      <button onClick={closeAddModal} className="p-2 bg-m3-surfaceContainerHigh rounded-full text-m3-onSurfaceVariant hover:bg-m3-secondaryContainer">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 safe-pb">
                      {/* Selection State */}
                      {addMethod === 'NONE' && (
                          <div className="grid gap-3">
                              <button onClick={() => setAddMethod('SCAN')} className="flex items-center gap-4 p-4 bg-m3-surfaceContainerHigh rounded-xl hover:bg-m3-secondaryContainer transition-colors text-left group border border-transparent hover:border-m3-outline/10">
                                  <div className="p-3 bg-m3-primaryContainer text-m3-onPrimaryContainer rounded-full">
                                      <Camera size={24} />
                                  </div>
                                  <div>
                                      <h4 className="font-medium text-lg text-m3-onSurface">{t.add_scan}</h4>
                                      <p className="text-sm text-m3-onSurfaceVariant">AI Identification</p>
                                  </div>
                              </button>
                              
                              <button onClick={() => setAddMethod('SEARCH_NAME')} className="flex items-center gap-4 p-4 bg-m3-surfaceContainerHigh rounded-xl hover:bg-m3-secondaryContainer transition-colors text-left group border border-transparent hover:border-m3-outline/10">
                                  <div className="p-3 bg-m3-secondaryContainer text-m3-onSecondaryContainer rounded-full">
                                      <Type size={24} />
                                  </div>
                                  <div>
                                      <h4 className="font-medium text-lg text-m3-onSurface">{t.add_search_name}</h4>
                                      <p className="text-sm text-m3-onSurfaceVariant">Live Search</p>
                                  </div>
                              </button>

                              <button onClick={() => setAddMethod('SEARCH_CODE')} className="flex items-center gap-4 p-4 bg-m3-surfaceContainerHigh rounded-xl hover:bg-m3-secondaryContainer transition-colors text-left group border border-transparent hover:border-m3-outline/10">
                                  <div className="p-3 bg-m3-secondaryContainer text-m3-onSecondaryContainer rounded-full">
                                      <Hash size={24} />
                                  </div>
                                  <div>
                                      <h4 className="font-medium text-lg text-m3-onSurface">{t.add_search_code}</h4>
                                      <p className="text-sm text-m3-onSurfaceVariant">8-digit Passcode</p>
                                  </div>
                              </button>
                          </div>
                      )}

                      {/* Scanner State */}
                      {addMethod === 'SCAN' && (
                          <div className="h-[400px]">
                              <Scanner 
                                  lang={lang}
                                  onCardScanned={(card) => {
                                      onAddCard(card);
                                      closeAddModal();
                                  }} 
                              />
                          </div>
                      )}

                      {/* Search State */}
                      {(addMethod === 'SEARCH_NAME' || addMethod === 'SEARCH_CODE') && (
                          <div className="flex flex-col h-full min-h-[400px] pb-24">
                              <div className="flex gap-2 mb-4">
                                  <input 
                                      autoFocus
                                      type={addMethod === 'SEARCH_CODE' ? 'number' : 'text'}
                                      placeholder={addMethod === 'SEARCH_CODE' ? t.search_code_placeholder : t.search_api_placeholder}
                                      value={apiQuery}
                                      onChange={(e) => setApiQuery(e.target.value)}
                                      onKeyDown={(e) => {
                                          if(addMethod === 'SEARCH_CODE' && e.key === 'Enter') handleApiSearch();
                                      }}
                                      className="flex-1 bg-m3-surfaceContainerHigh rounded-xl px-4 py-3 text-m3-onSurface focus:ring-2 focus:ring-m3-primary outline-none"
                                  />
                                  <button 
                                      onClick={handleApiSearch}
                                      disabled={isSearchingApi}
                                      className="bg-m3-primaryContainer text-m3-onPrimaryContainer px-4 rounded-xl font-medium disabled:opacity-50"
                                  >
                                      {isSearchingApi ? <Loader2 className="animate-spin" /> : <Search />}
                                  </button>
                              </div>

                              <div className="flex-1 overflow-y-auto">
                                  {apiResults.length === 0 && !isSearchingApi && apiQuery.length >= 3 && (
                                      <p className="text-center text-m3-onSurfaceVariant mt-10">{t.search_no_results}</p>
                                  )}
                                  <div className="grid grid-cols-2 gap-3 pb-4">
                                      {apiResults.map((res, i) => {
                                          const isSelected = selectedApiCard?.name === res.name;
                                          return (
                                            <div 
                                                key={i} 
                                                onClick={() => {
                                                    setSelectedApiCard(res);
                                                    setAddQuantity(1);
                                                }} 
                                                className={`bg-black rounded-lg overflow-hidden cursor-pointer relative aspect-[2/3] group shadow-lg transition-all ${isSelected ? 'ring-4 ring-m3-primary scale-95' : 'hover:ring-2 hover:ring-m3-primary/50'}`}
                                            >
                                                {res.imageUrl ? (
                                                    <img src={res.imageUrl} className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-50' : ''}`} />
                                                ) : (
                                                    <div className="p-2 text-white text-xs">{res.name}</div>
                                                )}
                                                
                                                {isSelected && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Check className="text-m3-primary w-12 h-12 drop-shadow-lg" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
                  
                  {/* Sticky Footer for Quantity & Confirm (Search Mode) */}
                  {selectedApiCard && (
                       <div className="absolute bottom-0 left-0 right-0 bg-m3-surfaceContainerHigh border-t border-m3-outline/20 p-4 shadow-xl animate-in slide-in-from-bottom">
                           <div className="flex justify-between items-center gap-4">
                               <div className="flex items-center gap-3 bg-m3-surfaceContainer rounded-xl p-1 border border-m3-outline/10">
                                    <button 
                                        onClick={() => setAddQuantity(q => Math.max(1, q - 1))}
                                        className="p-3 hover:bg-m3-secondaryContainer rounded-lg transition-colors text-m3-onSurface"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <span className="text-2xl font-bold w-8 text-center tabular-nums">{addQuantity}</span>
                                    <button 
                                        onClick={() => setAddQuantity(q => q + 1)}
                                        className="p-3 hover:bg-m3-secondaryContainer rounded-lg transition-colors text-m3-onSurface"
                                    >
                                        <Plus size={20} />
                                    </button>
                               </div>
                               
                               <button 
                                    onClick={confirmAddFromApi}
                                    className="flex-1 bg-m3-primaryContainer text-m3-onPrimaryContainer py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                               >
                                   {t.action_add}
                               </button>
                           </div>
                       </div>
                  )}
              </div>
          </div>
      )}

      {/* Delete Quantity Modal */}
      {cardToDelete && (
           <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-m3-surfaceContainer w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 border border-m3-error/20">
                    <h3 className="text-xl font-bold text-m3-onSurface mb-2">Delete Card</h3>
                    <p className="text-m3-onSurfaceVariant text-sm mb-6">
                        How many copies of <span className="font-bold text-m3-onSurface">{cardToDelete.name}</span> do you want to remove?
                    </p>

                    <div className="flex items-center justify-center gap-6 mb-8">
                        <button 
                            onClick={() => setDeleteQuantity(q => Math.max(1, q - 1))}
                            className="p-4 bg-m3-surfaceContainerHigh rounded-full hover:bg-m3-secondaryContainer"
                        >
                            <Minus />
                        </button>
                        <span className="text-4xl font-bold tabular-nums">{deleteQuantity}</span>
                        <button 
                            onClick={() => setDeleteQuantity(q => Math.min(cardToDelete.quantity || 1, q + 1))}
                            className="p-4 bg-m3-surfaceContainerHigh rounded-full hover:bg-m3-secondaryContainer"
                        >
                            <Plus />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setCardToDelete(null)}
                            className="flex-1 py-3 font-medium text-m3-onSurfaceVariant hover:bg-m3-surfaceContainerHigh rounded-xl"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDeleteConfirm}
                            className="flex-1 py-3 font-bold bg-m3-error text-m3-onError rounded-xl shadow-lg flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} /> Delete
                        </button>
                    </div>
               </div>
           </div>
      )}
    </div>
  );
};