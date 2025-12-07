import React, { useState, useRef } from 'react';
import { identifyCard } from '../services/geminiService';
import { CardData, Language } from '../types';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, ScanLine } from 'lucide-react';
import { translations } from '../utils/i18n';

interface ScannerProps {
  onCardScanned: (card: CardData) => void;
  lang: Language;
}

export const Scanner: React.FC<ScannerProps> = ({ onCardScanned, lang }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;

    setIsScanning(true);
    setError(null);

    try {
      const result = await identifyCard(image);
      
      const newCard: CardData = {
        id: crypto.randomUUID(),
        name: result.name,
        type: result.type,
        description: result.description,
        atk: result.atk,
        def: result.def,
        level: result.level,
        race: result.race,
        imageUrl: result.imageUrl || image, 
        scanDate: Date.now(),
        isOwned: true
      };

      onCardScanned(newCard);
    } catch (err) {
      setError(t.scanner_error);
    } finally {
      setIsScanning(false);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative min-h-[300px]">
        <div className="h-full w-full bg-black/90 rounded-2xl border border-m3-outline/20 overflow-hidden relative shadow-inner flex flex-col items-center justify-center group">
            {image ? (
                <img src={image} alt="Captured" className="w-full h-full object-contain" />
            ) : (
                <div onClick={triggerCamera} className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-m3-onSurfaceVariant/70 hover:text-m3-primary transition-colors relative">
                    {/* Reticle Guide Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[65%] aspect-[2/3] border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                            <div className="w-full h-[1px] bg-white/20 absolute"></div>
                            <div className="h-full w-[1px] bg-white/20 absolute"></div>
                        </div>
                    </div>
                    
                    <div className="bg-m3-surfaceContainer/50 p-6 rounded-full backdrop-blur-sm z-10 group-hover:scale-110 transition-transform">
                        <Camera size={40} strokeWidth={1.5} />
                    </div>
                    <span className="mt-6 font-medium text-sm px-4 py-1 bg-black/50 rounded-full backdrop-blur-md border border-white/10 z-10">
                        {t.scanner_instruction}
                    </span>
                </div>
            )}
            
            <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleCapture}
            className="hidden"
            />
        </div>

        {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-m3-error text-m3-onError p-3 rounded-xl flex items-center gap-3 shadow-lg text-sm animate-in slide-in-from-bottom">
            <AlertTriangle size={20} />
            <span className="font-medium">{error}</span>
            </div>
        )}
      </div>

      <div className="flex gap-4 mt-4 shrink-0">
        {image && !isScanning && (
            <button 
                onClick={() => setImage(null)}
                className="flex-1 py-3 px-6 rounded-xl bg-m3-surfaceContainerHigh text-m3-primary font-medium transition-all hover:bg-m3-secondaryContainer"
            >
                {t.deck_cancel}
            </button>
        )}
        
        {image ? (
          <button
            onClick={processImage}
            disabled={isScanning}
            className={`flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
              isScanning 
                ? 'bg-m3-surfaceContainer text-m3-onSurfaceVariant cursor-not-allowed' 
                : 'bg-m3-primaryContainer text-m3-onPrimaryContainer hover:brightness-110'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                {t.scanner_processing}
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                {t.scanner_confirm}
              </>
            )}
          </button>
        ) : (
            <button
            onClick={triggerCamera}
            className="w-full py-4 rounded-xl font-bold text-lg bg-m3-primaryContainer text-m3-onPrimaryContainer shadow-lg flex items-center justify-center gap-3 hover:brightness-110 transition-all active:scale-95"
          >
            <Camera size={24} />
            {t.add_scan}
          </button>
        )}
      </div>
    </div>
  );
};