import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CardType, CardData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cardSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The exact English name of the card as it appears in the database." },
    type: { 
      type: Type.STRING, 
      description: "The main type of the card: Monster, Spell, or Trap",
      enum: ["Monster", "Spell", "Trap"]
    },
    description: { type: Type.STRING, description: "The full text/effect description of the card" },
    atk: { type: Type.STRING, description: "Attack points (e.g., '2500' or '?')" },
    def: { type: Type.STRING, description: "Defense points (e.g., '2100' or '?')" },
    level: { type: Type.INTEGER, description: "Level or Rank (e.g., 7)" },
    race: { type: Type.STRING, description: "The race or sub-type (e.g., Dragon, Warrior, Continuous, Field)" },
    attribute: { type: Type.STRING, description: "The attribute (e.g., DARK, LIGHT, EARTH)" }
  },
  required: ["name", "type", "description"]
};

const deckSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        deckName: { type: Type.STRING, description: "A creative name for the deck" },
        mainDeck: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of card names for the Main Deck (40-60 cards)" },
        extraDeck: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of card names for the Extra Deck (0-15 cards)" }
    },
    required: ["deckName", "mainDeck"]
};

// Helper to normalize card data from API
const normalizeApiCard = (data: any): Partial<CardData> => {
    let normalizedType = CardType.UNKNOWN;
    const typeStr = data.type?.toLowerCase() || '';
    if (typeStr.includes('monster')) normalizedType = CardType.MONSTER;
    else if (typeStr.includes('spell')) normalizedType = CardType.SPELL;
    else if (typeStr.includes('trap')) normalizedType = CardType.TRAP;

    return {
        name: data.name,
        type: normalizedType,
        description: data.desc,
        atk: data.atk !== undefined ? String(data.atk) : undefined,
        def: data.def !== undefined ? String(data.def) : undefined,
        level: data.level,
        race: data.race,
        imageUrl: data.card_images?.[0]?.image_url
    };
};

export const searchCardByName = async (name: string) => {
    try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(name)}`);
        const data = await response.json();
        if (data.data) {
            return data.data.map(normalizeApiCard);
        }
        return [];
    } catch (e) {
        console.warn("Search failed", e);
        return [];
    }
};

export const searchCardByCode = async (code: string) => {
    try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${encodeURIComponent(code)}`);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            return [normalizeApiCard(data.data[0])];
        }
        return [];
    } catch (e) {
        console.warn("Code Search failed", e);
        return [];
    }
};

// Existing AI function
export const identifyCard = async (base64Image: string) => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Identify this Yu-Gi-Oh! card. Return the EXACT English card name. Also extract type, ATK/DEF, level, race, and description."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: cardSchema,
        systemInstruction: "You are an expert Yu-Gi-Oh! database. Precision is key."
      }
    });

    if (!response.text) throw new Error("No response from Gemini");

    const data = JSON.parse(response.text);
    
    let normalizedType = CardType.UNKNOWN;
    const typeStr = data.type?.toLowerCase();
    if (typeStr?.includes('monster')) normalizedType = CardType.MONSTER;
    else if (typeStr?.includes('spell')) normalizedType = CardType.SPELL;
    else if (typeStr?.includes('trap')) normalizedType = CardType.TRAP;

    // Fetch official image to enhance data
    const apiResults = await searchCardByName(data.name);
    const officialData = apiResults.length > 0 ? apiResults[0] : {};

    return {
      ...data,
      type: normalizedType,
      imageUrl: officialData.imageUrl || null 
    };

  } catch (error) {
    console.error("Card Identification Failed:", error);
    throw error;
  }
};

export const generateDeck = async (coreCards: string[], mode: 'OWNED' | 'UNLIMITED', availableCollection: string[] = []) => {
    try {
        const prompt = mode === 'OWNED' 
            ? `Build the best possible Yu-Gi-Oh! deck that focuses on these core cards: ${coreCards.join(', ')}. 
               CRITICAL: You must ONLY use cards from this available list: ${availableCollection.join(', ')}. Do not suggest cards not in the list.
               Construct a Main Deck (40-60 cards) and an Extra Deck (0-15 cards) if the strategy requires it.`
            : `Build a competitive/meta Yu-Gi-Oh! deck revolving around: ${coreCards.join(', ')}. 
               You can suggest any card in the game. 
               Construct a Main Deck (40 cards usually) and an Extra Deck (up to 15 cards) containing relevant Fusion, Synchro, Xyz, or Link monsters.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: deckSchema,
                systemInstruction: "You are a world-champion Yu-Gi-Oh! deck builder. Create synergistic, consistent decks."
            }
        });

        if (!response.text) throw new Error("AI Generation failed");
        return JSON.parse(response.text) as { deckName: string, mainDeck: string[], extraDeck?: string[] };

    } catch (e) {
        console.error("Deck Generation Failed", e);
        throw e;
    }
};