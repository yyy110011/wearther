import { useState } from 'react';
import { CloudSun, Briefcase, Settings } from 'lucide-react';
import { DEFAULT_INVENTORY } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useWeather } from './hooks/useWeather';
import { DailyTab } from './components/DailyTab';
import { TripTab } from './components/TripTab';
import { SettingsTab } from './components/SettingsTab';

const App = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [returnTime, setReturnTime] = useState("20:00");
  const [searchCity, setSearchCity] = useState("");

  // localStorage-backed state (replaces Firebase)
  const [inventory, setInventory] = useLocalStorage('wearther-inventory', DEFAULT_INVENTORY);
  const [preferences, setPreferences] = useLocalStorage('wearther-preferences', { upperSensitive: false, lowerSensitive: false });
  const [trips, setTrips] = useLocalStorage('wearther-trips', []);

  const { loading, error, weather, recommendation, fetchWeather, handleGeolocation } = useWeather({
    returnTime, inventory, preferences
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-lg"><CloudSun size={20} /></div> Wearther
        </h1>
        <nav className="flex bg-slate-100 p-1 rounded-full">
          {['daily', 'trip', 'settings'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`p-2 px-4 rounded-full transition-all flex items-center gap-2 text-xs font-bold uppercase ${activeTab === t ? 'bg-white shadow-sm text-black' : 'text-slate-400'}`}>
              {t === 'daily' ? <CloudSun size={16} /> : t === 'trip' ? <Briefcase size={16} /> : <Settings size={16} />}
              {activeTab === t && t}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        {activeTab === 'daily' && (
          <DailyTab
            weather={weather} recommendation={recommendation} loading={loading}
            returnTime={returnTime} setReturnTime={setReturnTime}
            searchCity={searchCity} setSearchCity={setSearchCity}
            fetchWeather={fetchWeather} handleGeolocation={handleGeolocation}
          />
        )}

        {activeTab === 'trip' && (
          <TripTab trips={trips} setTrips={setTrips} inventory={inventory} preferences={preferences} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab preferences={preferences} setPreferences={setPreferences} inventory={inventory} setInventory={setInventory} />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 text-center z-20">
        <p className="text-[9px] text-slate-300 font-black tracking-[0.4em] uppercase">Wearther // Engine v3.8.2 // Custom Asset Icons</p>
      </footer>
    </div>
  );
};

export default App;
