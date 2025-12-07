import React, { useMemo, useState, useEffect } from 'react';
import { CardData, CardType, Language } from '../types';
import { Scanner } from './Scanner';
import { searchCardByName, searchCardByCode } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { Search, Trash2, PlusCircle, Plus, Camera, Type, Hash, X, Loader2, ArrowUpDown } from 'lucide-react';

interface CollectionProps {
  cards: CardData[];
  onDeleteCard: (id: string) => void;
  onAddCard: (card: CardData) => void;
  onAddToDeck?: (card: CardData) => void; 
  onSelectCard?: (card: CardData) => void;
  selectionMode?: boolean;
  lang: Language;
}

type SortOption = 'NEWEST' | 'NAME' | 'ATK';

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
  const [filter, setFilter] = useState<'ALL' | CardType>('ALL');
  const [sort, setSort] = useState<SortOption>('NEWEST');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<'NONE' | 'SCAN' | 'SEARCH_NAME' | 'SEARCH_CODE'>('NONE');
  
  // Search State
  const [apiQuery, setApiQuery] = useState('');
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiResults, setApiResults] = useState<Partial<CardData>[]>([]);

  const filteredCards = useMemo(() => {
    let result = cards.filter(c => {
      // ONLY SHOW OWNED CARDS IN COLLECTION VIEW
      if (c.isOwned === false) return false;

      const matchesType = filter === 'ALL' || c.type === filter;
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
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

  const handleAddFromApi = (partialCard: Partial<CardData>) => {
      const newCard: CardData = {
          id: crypto.randomUUID(),
          name: partialCard.name || 'Unknown',
          type: partialCard.type || CardType.UNKNOWN,
          description: partialCard.description || '',
          atk: partialCard.atk,
          def: partialCard.def,
          level: partialCard.level,
          race: partialCard.race,
          imageUrl: partialCard.imageUrl,
          scanDate: Date.now(),
          isOwned: true,
          quantity: 1
      };
      onAddCard(newCard);
      setIsAddModalOpen(false);
      setAddMethod('NONE');
      setApiQuery('');
      setApiResults([]);
  };

  return (
    <div className="flex flex-col h-full bg-m3-background relative">
      {/* Header & Filters */}
      <div className="px-4 pt-6 pb-2 bg-m3-background/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-normal text-m3-onSurface">
              {selectionMode ? t.action_add : t.nav_collection} 
            </h2>
            
            {/* Sort Dropdown / Toggle */}
            {!selectionMode && (
                <button 
                  onClick={() => setSort(prev => prev === 'NEWEST' ? 'NAME' : (prev === 'NAME' ? 'ATK' : 'NEWEST'))}
                  className="flex items-center gap-1 text-xs font-bold bg-m3-surfaceContainerHigh px-3 py-1.5 rounded-lg text-m3-onSurfaceVariant uppercase"
                >
                    <ArrowUpDown size={14} /> {sort}
                </button>
            )}
        </div>
        
        {/* Local Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-3.5 text-m3-onSurfaceVariant" size={20} />
          <input 
            type="text" 
            placeholder={t.col_search_placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-m3-surfaceContainerHigh rounded-full py-3 pl-12 pr-4 text-base text-m3-onSurface placeholder-m3-onSurfaceVariant focus:outline-none focus:ring-2 focus:ring-m3-primary transition-all shadow-sm"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['ALL', CardType.MONSTER, CardType.SPELL, CardType.TRAP].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                filter === type 
                  ? 'bg-m3-secondaryContainer text-m3-onSecondaryContainer border-m3-secondaryContainer' 
                  : 'bg-transparent text-m3-onSurfaceVariant border-m3-outline/50 hover:bg-m3-surfaceContainerHigh'
              }`}
            >
              {type === 'ALL' ? 'All' : type}
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-24">
            {filteredCards.map((card) => (
              <div 
                key={card.id} 
                onClick={() => {
                  if (selectionMode && onAddToDeck) {
                    onAddToDeck(card);
                  } else if (onSelectCard) {
                    onSelectCard(card);
                  }
                }}
                className="bg-m3-surfaceContainerLow rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group aspect-[2/3] border border-m3-outline/10"
              >
                 {card.imageUrl ? (
                     <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
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
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="bg-m3-surfaceContainer w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom shadow-2xl">
                  {/* Header */}
                  <div className="p-4 border-b border-m3-outline/10 flex justify-between items-center">
                      <h3 className="text-xl font-normal text-m3-onSurface">{t.col_add_title}</h3>
                      <button onClick={() => { setIsAddModalOpen(false); setAddMethod('NONE'); setApiQuery(''); setApiResults([]); }} className="p-2 bg-m3-surfaceContainerHigh rounded-full text-m3-onSurfaceVariant hover:bg-m3-secondaryContainer">
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
                                      // Close modal
                                      setIsAddModalOpen(false);
                                      setAddMethod('NONE');
                                  }} 
                              />
                          </div>
                      )}

                      {/* Search State */}
                      {(addMethod === 'SEARCH_NAME' || addMethod === 'SEARCH_CODE') && (
                          <div className="flex flex-col h-full min-h-[400px]">
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
                                      {apiResults.map((res, i) => (
                                          <div key={i} onClick={() => handleAddFromApi(res)} className="bg-black rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-m3-primary relative aspect-[2/3] group shadow-lg">
                                              {res.imageUrl ? (
                                                  <img src={res.imageUrl} className="w-full h-full object-cover" />
                                              ) : (
                                                  <div className="p-2 text-white text-xs">{res.name}</div>
                                              )}
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                   <PlusCircle className="text-white transform scale-125 drop-shadow-lg" />
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};