import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Navigation, Check, X, Search, Edit2 } from 'lucide-react';

type LocationState = 'idle' | 'detecting' | 'found' | 'manual';

interface LocationPickerProps {
  value: string;
  onChange: (val: string) => void;
  lang: string;
  t: Record<string, string>;
}

const MOCK_WARDS = [
  "MG Road Area, Ward 111",
  "Koramangala, Ward 151",
  "Indiranagar, Ward 89",
  "Jayanagar, Ward 168",
  "Whitefield, Ward 82"
];

export function LocationPicker({ value, onChange, lang, t }: LocationPickerProps) {
  const [status, setStatus] = useState<LocationState>('idle');
  const [detectedArea, setDetectedArea] = useState<string>('');
  const [manualInput, setManualInput] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setManualInput(value);
  }, [value]);

  const mockReverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      
      // Attempt to extract the most readable area name
      const address = data.address;
      const area = address.neighbourhood || address.suburb || address.village || address.town || address.city_district || address.city;
      const state = address.state || address.region;
      
      return area ? `${area}, ${state || ''}`.replace(/, $/, '') : data.display_name.split(',').slice(0, 2).join(',');
    } catch (error) {
      console.warn('Geocoding API error:', error);
      // Fallback to random mock if API fails/rate-limits
      await new Promise(r => setTimeout(r, 600));
      return MOCK_WARDS[Math.floor(Math.random() * MOCK_WARDS.length)];
    }
  };

  const handleDetect = () => {
    setStatus('detecting');
    if (!navigator.geolocation) {
      setStatus('manual');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const area = await mockReverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setDetectedArea(area);
          setStatus('found');
        } catch (e) {
          setStatus('manual');
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setStatus('manual');
      },
      { timeout: 8000, maximumAge: 0 }
    );
  };

  const confirmLocation = () => {
    onChange(detectedArea);
    setStatus('idle');
  };

  const rejectLocation = () => {
    setStatus('manual');
    setShowDropdown(true);
  };

  const selectManual = (area: string) => {
    setManualInput(area);
    onChange(area);
    setShowDropdown(false);
    setStatus('idle');
  };

  // Translations inline for specific states
  const tLoc = {
    add: lang === 'en' ? "Add Location" : "स्थान जोड़ें",
    detecting: lang === 'en' ? "Detecting location..." : "स्थान का पता लगाया जा रहा है...",
    isThis: lang === 'en' ? "Is this your location?" : "क्या यह आपका स्थान है?",
    yes: lang === 'en' ? "Yes, use this" : "हाँ, इसका उपयोग करें",
    no: lang === 'en' ? "No, choose different" : "नहीं, दूसरा चुनें",
    searchPh: lang === 'en' ? "Search area, landmark..." : "क्षेत्र खोजें...",
  };

  return (
    <div className="flex flex-col w-full text-sm">
      {/* Screen Reader Live Region */}
      <div aria-live="polite" className="sr-only">
        {status === 'detecting' && "Detecting your current location..."}
        {status === 'found' && `Location found: ${detectedArea}. Please confirm.`}
      </div>

      {status === 'idle' && (
        <div className="flex items-center gap-2 px-4 py-3">
          <MapPin className={`w-4 h-4 shrink-0 ${value ? 'text-[#FFA958]' : 'text-black/30'}`} />
          {value ? (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-black/80 truncate">{value}</span>
              <button 
                onClick={() => setStatus('manual')}
                className="text-[10px] font-bold text-black/40 hover:text-black/60 uppercase tracking-wider px-2 py-1 bg-black/5 rounded-full"
              >
                Edit
              </button>
            </div>
          ) : (
            <button 
              onClick={handleDetect}
              className="flex-1 text-left text-sm font-medium text-black/40 hover:text-black/60 flex items-center gap-1.5"
            >
              {tLoc.add}
            </button>
          )}
        </div>
      )}

      {status === 'detecting' && (
        <div className="flex items-center gap-2 px-4 py-3 text-black/50">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#FFA958]" />
          <span className="text-sm font-medium animate-pulse">{tLoc.detecting}</span>
        </div>
      )}

      {status === 'found' && (
        <div className="flex flex-col gap-2 px-4 py-3 bg-[#FFA958]/10">
          <div className="flex items-start gap-2">
            <Navigation className="w-4 h-4 text-[#FFA958] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-[#FFA757] uppercase tracking-wide mb-0.5">{tLoc.isThis}</p>
              <p className="text-sm font-semibold text-black/80">{detectedArea}</p>
              <p className="text-[10px] text-black/40 mt-0.5">Detected approx. area</p>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button 
              onClick={confirmLocation}
              className="flex-1 bg-[#FFA958] text-black font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Check className="w-3.5 h-3.5" /> {tLoc.yes}
            </button>
            <button 
              onClick={rejectLocation}
              className="flex-1 bg-white border border-black/10 text-black/60 font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" /> {tLoc.no}
            </button>
          </div>
        </div>
      )}

      {status === 'manual' && (
        <div className="flex flex-col px-4 py-3 gap-2">
          <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-black/40 shrink-0" />
            <input
              autoFocus
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                onChange(e.target.value);
                setShowDropdown(true);
              }}
              placeholder={tLoc.searchPh}
              className="flex-1 bg-transparent text-sm text-black outline-none placeholder:text-black/30"
              onFocus={() => setShowDropdown(true)}
            />
            <button 
              onClick={() => {
                setStatus('idle');
                setShowDropdown(false);
              }}
              className="p-1 text-black/40 hover:text-black/60"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
          
          {showDropdown && (
            <div className="flex flex-col gap-1 mt-1 max-h-32 overflow-y-auto">
              <p className="text-[10px] font-bold text-black/30 uppercase tracking-wider px-1">Suggested Areas</p>
              {MOCK_WARDS.filter(w => w.toLowerCase().includes(manualInput.toLowerCase())).map((ward, i) => (
                <button
                  key={i}
                  onClick={() => selectManual(ward)}
                  className="text-left text-sm text-black/70 py-1.5 px-2 hover:bg-black/5 rounded-lg transition-colors"
                >
                  {ward}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
