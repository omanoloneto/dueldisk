<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<h1>DuelDisk Scanner</h1>

  AI-assisted Yu-Gi-Oh! life tracker, collection manager, and deck builder.<br />
  Runs as a modern PWA and can be packaged as an Android app via Capacitor.

---

## ✨ Overview

DuelDisk Scanner is a Progressive Web App designed for Yu-Gi-Oh! players who want a **smart, modern “duel assistant”** in their pocket.

It brings together:

- **Duel screen** with life-point tracking, dice & coin tools, and visual HP bar  
- **Collection (“Armory”)** to manage your cards with AI scanning and external API search  
- **Deck builder** with an AI deck wizard that can build lists based on your collection or optimal meta lists  
- **Immersive card viewer** with full details and fullscreen art  
- **Multi-language support**, offline storage, and installable PWA experience  
- Optional **Android APK** packaging via Capacitor

All of this powered by **React + Vite**, **Gemini** for AI, and **YGOPRODeck** as card data source.

---

## 🧩 Features

### 1. Duel Screen (Life Points)

Fast, duel-ready interface to use during matches.

- **Life Points calculator**
  - Starts at **8000 LP**
  - Add / subtract custom values
  - Quick actions: Half, −1000, −500, −100
- **Visual HP bar**
  - Color-coded bar at the top:
    - Green → healthy
    - Yellow → mid
    - Red → critical
- **Duel tools**
  - **Dice**: single D6 roll with visual feedback
  - **Coin**: heads / tails
  - **Reset**: resets the duel state
- **History log**
  - Shows recent LP changes (+ / −) in a compact sidebar
- **Haptic feedback**
  - Button presses trigger vibration on supported mobile devices

---

### 2. Collection Screen (Trunk)

A complete place to manage your physical and digital cards.

- **Card grid**
  - Infinite scroll
  - Shows card image, colored type indicator, and owned quantity
- **Smart filters**
  - Quick chips for:
    - Monster, Spell, Trap
    - Fusion, Synchro, Xyz, Link, Ritual
- **Sorting options**
  - Most recent
  - Name
  - Attack (ATK)
- **Search bar**
  - Classic top bar with expandable text search

#### Adding cards (3 ways)

1. **AI Scanner (Camera)**
   - Use your camera to capture a physical card
   - Gemini identifies:
     - Name
     - Type
     - Attributes
     - Effect text

2. **Name search**
   - Live search through **YGOPRODeck API**
   - Autocomplete style lookup by card name

3. **Passcode search**
   - Search via the **8-digit passcode** printed on the card

#### Management

- Long-press a card to:
  - Change quantity
  - Delete from collection

---

### 3. Decks Screen (Deck Builder)

A full-featured deck builder with AI support.

- **Deck overview**
  - List of your decks
  - Automatic “cover” using the first card of the deck
- **Validation**
  - Main Deck validity: 40–60 cards
  - Icons indicating valid / invalid state at a glance

#### Deck editor

- Tabs for:
  - **Main Deck**
  - **Extra Deck**
  - **Side Deck**
- Ownership-aware
  - Prevents adding more copies than you own in the **Armory**
- **Notes & strategy**
  - Per-deck notes section
  - Save combos, tech choices, and play patterns

#### AI Deck Wizard

Let AI assist your deckbuilding:

- Pick a set of **“core” cards**
- Two AI modes:
  - **“Owned Cards” mode**
    - Builds the best possible list using only cards you actually have in your Collection
  - **“Unlimited / Proxy” mode**
    - Builds an optimized/meta deck using all available cards, even if not in your collection
- Generates a **strategy guide** for the deck:
  - Game plan
  - Key combos
  - Tech suggestions

---

### 4. Card Details (Immersive Viewer)

Tap any card in Collection or Decks to open a rich card view.

- **Parallax description**
  - Smooth scrolling description layered over the card art
- **Fullscreen zoom**
  - Tap the image or zoom button
  - High-quality fullscreen art
- **Full data display**
  - Attribute icons
  - Level / Rank stars
  - Type / Race
  - ATK / DEF
  - Full effect text

---

### 5. Settings & System

Quality-of-life features to make the app feel truly “yours”.

- **Themes**
  - Full **Dark Mode** (default)
  - Optional **Light Mode**
- **Localization (i18n)**
  - Fully localized UI for:
    - Portuguese
    - English
    - Spanish
    - Japanese
    - German
    - French
    - Italian
    - Korean
- **Local storage / offline**
  - Uses **IndexedDB** to store:
    - Collection
    - Decks
  - Works offline once loaded
- **PWA**
  - Installable on Android / iOS as a home-screen app
  - Runs fullscreen, without browser chrome

---

## 🛠 Tech Stack

- **Frontend**
  - React 19
  - Vite
  - TypeScript
  - Tailwind CSS (Material Design 3-inspired styling)
- **AI**
  - Google Gemini 2.5 Flash  
    - Vision (card scanning)  
    - Text (deck strategy & suggestions)
- **Data**
  - YGOPRODeck API  
    - Card metadata  
    - Official images
- **Packaging**
  - PWA (manifest + service worker)
  - Capacitor (Android APK wrapper via WebView)

---

## 🚀 Getting Started

### 1. Requirements

- Node.js (LTS recommended)  
- npm  
- A valid **Gemini API key** (`GEMINI_API_KEY`)

### 2. Install dependencies

```bash  
npm install  
```

### 3. Configure environment

Create a `.env.local` file in the project root:

```bash  
GEMINI_API_KEY=your_gemini_api_key_here  
```

### 4. Run in development

```bash  
npm run dev  
```

Vite will start a dev server (typically `http://localhost:5173`).

---

## 📦 Production Build (Web / PWA)

To build the app for production:

```bash  
npm run build  
```

This generates the `dist/` folder with optimized static assets.

To preview the production build locally:

```bash  
npm run preview  
```

You can deploy `dist/` to any static hosting service that supports HTTPS.

---

## 📱 Packaging as Android APK (via Capacitor)

> One-time setup steps are marked. Day-to-day updates are basically `npm run build` + `npx cap copy` + build in Android Studio.

### 1. Install Capacitor (one-time)

```bash  
npm install @capacitor/core @capacitor/cli  
```

### 2. Initialize Capacitor (one-time)

```bash  
npx cap init "DuelDisk Scanner" com.redstudios.dueldiskscanner --web-dir=dist  
```

### 3. Add Android platform (one-time)

```bash  
npx cap add android  
```

### 4. Build web & sync to Android

After any code change you want reflected in the APK:

```bash  
npm run build  
npx cap copy  
```

If you changed Capacitor plugins/config, use:

```bash  
npx cap sync  
```

### 5. Open in Android Studio

```bash  
npx cap open android  
```

Then in **Android Studio**:

- Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**  
- Locate the generated `app-debug.apk` (or signed release APK/AAB)

---

## 🤝 Contributing

Contributions, ideas, and bug reports are very welcome!

- Found a bug?  
  → Open an issue with reproduction steps and screenshots if possible.

- Have a feature idea (new duel tools, new filters, better AI prompts)?  
  → Open an issue or PR describing:
  - The problem it solves for players
  - Any UI/UX notes
  - Technical approach (if you already have one)

- Want to help with translations?  
  → Submit updates to existing locales or add new languages under the i18n setup.

Please follow a few simple guidelines:

- Keep PRs focused on one thing (bugfix, feature, refactor).
- Prefer small, incremental improvements rather than huge “everything at once” changes.
- When touching AI prompts or Gemini integration, explain the intent clearly so behavior changes are understood.

---

## 💡 Roadmap Ideas

Some possible future enhancements:

- Match history with per-duel logs  
- Multiplayer sync of LP between devices  
- Side-decking assistant between games 1/2/3  
- Export / import decks in popular formats (e.g. YDK)  
- More advanced AI analysis (matchups, sideboard plans)

---

Built for duelists who love both cardboard and code. 🃏⚙️
