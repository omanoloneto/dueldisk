
export enum CardType {
  MONSTER = 'Monster',
  SPELL = 'Spell',
  TRAP = 'Trap',
  UNKNOWN = 'Unknown'
}

export interface CardData {
  id: string; // Unique ID for the specific instance in storage
  name: string;
  type: CardType;
  description: string;
  atk?: string;
  def?: string;
  level?: number;
  race?: string;
  imageUrl?: string; // Base64 or placeholder
  scanDate: number;
  isOwned?: boolean; // Defaults to true if undefined. False means it's a proxy/wishlist item.
  quantity?: number; // Quantity owned. Defaults to 1.
}

export interface Deck {
  id: string;
  name: string;
  cards: string[]; // Main Deck IDs
  extraDeck?: string[]; // Extra Deck IDs
  sideDeck?: string[]; // Side Deck IDs
  notes?: string; // Strategy guide or user notes
  createdAt: number;
}

export enum AppView {
  DUEL = 'duel',
  COLLECTION = 'collection',
  DECKS = 'decks',
  SETTINGS = 'settings',
  CARD_DETAILS = 'card_details'
}

export type Language = 'pt' | 'en' | 'es' | 'ja' | 'de' | 'fr' | 'it' | 'ko';

export type Theme = 'light' | 'dark';