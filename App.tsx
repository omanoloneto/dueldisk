import React, { useState, useEffect } from 'react';
import { Collection } from './components/Collection';
import { DeckBuilder } from './components/DeckBuilder';
import { CardDetails } from './components/CardDetails';
import { LifePoints } from './components/LifePoints';
import { Settings } from './components/Settings';
import { AppView, CardData, Deck, Language, Theme } from './types';
import { translations } from './utils/i18n';
import { Swords, Library, Layers, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { storageService } from './services/storageService';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.DUEL);
  // Keep track of previous view to return from details
  const [previousView, setPreviousView] = useState<AppView>(AppView.COLLECTION);
  
  const [lang, setLang] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('dark');
  const [cards, setCards] = useState<CardData[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Data
  useEffect(() => {
    const initData = async () => {
      try {
        const [loadedCards, loadedDecks] = await Promise.all([
          storageService.getAllCards(),
          storageService.getAllDecks()
        ]);
        setCards(loadedCards);
        setDecks(loadedDecks);
      } catch (e) {
        console.error("Failed to load data", e);
        showNotification("Erro ao carregar dados.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();

    // Keep settings in localStorage for simple sync preference
    const savedLang = localStorage.getItem('dueldisk_lang');
    const savedTheme = localStorage.getItem('dueldisk_theme');
    if (savedLang) setLang(savedLang as Language);
    if (savedTheme) setTheme(savedTheme as Theme);
  }, []);

  useEffect(() => {
    localStorage.setItem('dueldisk_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('dueldisk_theme', theme);
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddCard = async (card: CardData) => {
    try {
      // Check if duplicate exists
      const existingCardIndex = cards.findIndex(c => c.name.toLowerCase() === card.name.toLowerCase() && c.isOwned === true);
      const qtyToAdd = card.quantity && card.quantity > 0 ? card.quantity : 1;

      if (existingCardIndex >= 0) {
          // Increment quantity
          const existingCard = cards[existingCardIndex];
          const updatedCard = { 
              ...existingCard, 
              quantity: (existingCard.quantity || 1) + qtyToAdd,
              // Update image if the new scan is better? For now keep old image to avoid jump
          };
          
          await storageService.saveCard(updatedCard);
          
          const newCards = [...cards];
          newCards[existingCardIndex] = updatedCard;
          setCards(newCards);
          showNotification(`${updatedCard.name} (+${qtyToAdd}) saved!`);
      } else {
          // Create new
          const newCard = { ...card, quantity: qtyToAdd };
          await storageService.saveCard(newCard);
          setCards(prev => [newCard, ...prev]);
          showNotification(`${newCard.name} (x${qtyToAdd}) saved!`);
      }
    } catch (e) {
      showNotification("Erro ao salvar carta.");
    }
  };

  const handleDeleteCard = async (id: string, qtyToDelete: number = 1) => {
      try {
        const card = cards.find(c => c.id === id);
        if (!card) return;

        const currentQty = card.quantity || 1;

        if (currentQty > qtyToDelete) {
            // Decrement
            const updatedCard = { ...card, quantity: currentQty - qtyToDelete };
            await storageService.saveCard(updatedCard);
            setCards(prev => prev.map(c => c.id === id ? updatedCard : c));
            showNotification(`Removido ${qtyToDelete} unidade(s).`);
        } else {
            // Full Delete
            await storageService.deleteCard(id);
            setCards(prev => prev.filter(c => c.id !== id));
            
            // Update decks that might contain this card
            const updatedDecks = decks.map(d => ({
            ...d,
            cards: d.cards.filter(cId => cId !== id),
            extraDeck: d.extraDeck?.filter(cId => cId !== id),
            sideDeck: d.sideDeck?.filter(cId => cId !== id)
            }));
            setDecks(updatedDecks);
            
            // Save updated decks
            updatedDecks.forEach(d => storageService.saveDeck(d));
            showNotification("Carta excluída.");
        }

        if (selectedCard?.id === id) {
            setSelectedCard(null);
            setView(previousView);
        }
      } catch (e) {
        showNotification("Erro ao apagar carta.");
      }
  };

  const handleCreateDeck = async (name: string, mainCards: CardData[] = [], extraCards: CardData[] = [], sideCards: CardData[] = [], notes: string = '') => {
    try {
        // Collect all new cards from all sections
        const allNewCards = [...mainCards, ...extraCards, ...sideCards];

        if (allNewCards.length > 0) {
            const newCardsToSave: CardData[] = [];
            const currentCardIds = new Set(cards.map(c => c.id));
            
            // Deduplicate logic just in case
            const processedIds = new Set<string>();

            for (const card of allNewCards) {
                if (!currentCardIds.has(card.id) && !processedIds.has(card.id)) {
                    // For AI generated cards, ensure quantity is 1
                    newCardsToSave.push({...card, quantity: 1});
                    processedIds.add(card.id);
                }
            }

            if (newCardsToSave.length > 0) {
                await Promise.all(newCardsToSave.map(c => storageService.saveCard(c)));
                setCards(prev => [...newCardsToSave, ...prev]);
            }
        }

        const newDeck: Deck = {
            id: crypto.randomUUID(),
            name,
            cards: mainCards.map(c => c.id),
            extraDeck: extraCards.map(c => c.id),
            sideDeck: sideCards.map(c => c.id),
            notes: notes,
            createdAt: Date.now()
        };

        await storageService.saveDeck(newDeck);
        setDecks(prev => [...prev, newDeck]);
    } catch (e) {
        console.error(e);
        showNotification("Erro ao criar deck.");
    }
  };

  const handleUpdateDeck = async (updatedDeck: Deck) => {
    try {
        await storageService.saveDeck(updatedDeck);
        setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
    } catch (e) {
        showNotification("Erro ao atualizar deck.");
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (confirm(translations[lang].confirm_delete_deck)) {
      try {
        await storageService.deleteDeck(id);
        setDecks(prev => prev.filter(d => d.id !== id));
      } catch (e) {
        showNotification("Erro ao apagar deck.");
      }
    }
  };

  const openCardDetails = (card: CardData) => {
      setSelectedCard(card);
      // Only set previous view if we aren't already in details (to avoid loops)
      if (view !== AppView.CARD_DETAILS) {
          setPreviousView(view);
      }
      setView(AppView.CARD_DETAILS);
  };

  const closeCardDetails = () => {
      setSelectedCard(null);
      setView(previousView);
  };

  // M3 Bottom Navigation Item
  const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1 w-full justify-center group"
    >
      <div className={`px-5 py-1 rounded-full transition-all duration-300 ${active ? 'bg-m3-secondaryContainer text-m3-onSecondaryContainer' : 'text-m3-onSurfaceVariant group-hover:bg-m3-surfaceContainerHigh'}`}>
        <Icon size={22} className={active ? 'fill-current' : ''} />
      </div>
      <span className={`text-[10px] font-medium transition-colors ${active ? 'text-m3-onSurface' : 'text-m3-onSurfaceVariant'}`}>
        {label}
      </span>
    </button>
  );

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-m3-background text-m3-primary">
              <Loader2 size={48} className="animate-spin" />
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-m3-background text-m3-onSurface font-sans transition-colors duration-300">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {view === AppView.DUEL && (
          <LifePoints lang={lang} />
        )}
        
        {view === AppView.COLLECTION && (
          <Collection 
            cards={cards} 
            onDeleteCard={handleDeleteCard} 
            onSelectCard={openCardDetails}
            onAddCard={handleAddCard}
            lang={lang}
          />
        )}
        
        {view === AppView.DECKS && (
          <DeckBuilder 
            decks={decks}
            allCards={cards}
            onCreateDeck={handleCreateDeck}
            onUpdateDeck={handleUpdateDeck}
            onDeleteDeck={handleDeleteDeck}
            onChangeView={setView}
            onViewCard={openCardDetails}
            lang={lang}
          />
        )}

        {view === AppView.SETTINGS && (
          <Settings 
             lang={lang}
             setLang={setLang}
             theme={theme}
             setTheme={setTheme}
          />
        )}

        {/* Full Screen Card Details */}
        {view === AppView.CARD_DETAILS && selectedCard && (
          <CardDetails 
            card={selectedCard} 
            onClose={closeCardDetails} 
          />
        )}

        {/* Notification Toast */}
        {notification && (
          <div className="absolute bottom-24 left-4 bg-m3-onSurface text-m3-surfaceContainer px-6 py-3 rounded-xl shadow-xl z-50 animate-bounce font-medium text-sm whitespace-nowrap">
            {notification}
          </div>
        )}
      </main>

      {/* Material 3 Bottom Navigation - Hide on Full Screen Details */}
      {view !== AppView.CARD_DETAILS && (
        <nav className="bg-m3-surfaceContainer border-t border-m3-outline/10 safe-pb shrink-0 z-50">
            <div className="flex justify-around items-center h-[72px]">
            <NavItem 
                icon={Swords} 
                label={translations[lang].nav_duel} 
                active={view === AppView.DUEL} 
                onClick={() => setView(AppView.DUEL)} 
            />
            <NavItem 
                icon={Library} 
                label={translations[lang].nav_collection} 
                active={view === AppView.COLLECTION} 
                onClick={() => setView(AppView.COLLECTION)} 
            />
            <NavItem 
                icon={Layers} 
                label={translations[lang].nav_decks} 
                active={view === AppView.DECKS} 
                onClick={() => setView(AppView.DECKS)} 
            />
            <NavItem 
                icon={SettingsIcon} 
                label={translations[lang].nav_settings} 
                active={view === AppView.SETTINGS} 
                onClick={() => setView(AppView.SETTINGS)} 
            />
            </div>
        </nav>
      )}
    </div>
  );
}