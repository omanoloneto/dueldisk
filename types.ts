
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
}

export interface Deck {
  id: string;
  name: string;
  cards: string[]; // Array of CardData IDs
  createdAt: number;
}

export enum AppView {
  DUEL = 'duel',
  COLLECTION = 'collection',
  DECKS = 'decks',
  SETTINGS = 'settings'
}

export type Language = 'pt' | 'en' | 'es' | 'ja' | 'de' | 'fr' | 'it' | 'ko';

export type Theme = 'light' | 'dark';
