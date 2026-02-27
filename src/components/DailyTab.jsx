import {
  CloudSun, Thermometer, Umbrella, Clock, Shirt, Wind,
  Navigation, Search, Zap, TrendingUp, TrendingDown
} from 'lucide-react';
import { Card } from './Card';
import { Pants } from './Pants';

export const DailyTab = ({
  weather, recommendation, loading, returnTime, setReturnTime,
  searchCity, setSearchCity, fetchWeather, handleGeolocation
}) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <form onSubmit={(e) => { e.preventDefault(); fetchWeather({ city: searchCity }); }} className="flex gap-2">
      <input type="text" placeholder="Search City..." value={searchCity} onChange={(e) => setSearchCity(e.target.value)}
        className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 shadow-sm" />
      <button type="button" onClick={handleGeolocation} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-black shadow-sm"><Navigation size={18} /></button>
    </form>

    <Card className="bg-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{weather?.location || "N/A"}</span>
          </div>
          <h2 className="text-6xl font-black tracking-tighter">{weather ? `${weather.current.temp}°` : "--°"}</h2>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-slate-500 font-bold text-sm uppercase">{weather?.current.condition || "Loading"}</p>
            {weather && recommendation?.trend === 'up' && <TrendingUp size={14} className="text-orange-400" />}
            {weather && recommendation?.trend === 'down' && <TrendingDown size={14} className="text-blue-400" />}
          </div>
        </div>
        {!loading && <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg"><Thermometer size={28} /></div>}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><Wind size={18} /></div>
          <div><p className="text-[9px] font-black uppercase text-slate-400">Feels Like</p><p className="font-bold text-sm">{weather ? `${weather.current.feels_like}°` : "--"}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><Umbrella size={18} /></div>
          <div><p className="text-[9px] font-black uppercase text-slate-400">Rain Prob.</p><p className="font-bold text-sm">{weather ? `${weather.current.pop}%` : "--"}</p></div>
        </div>
      </div>
    </Card>

    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Clock size={16} className="text-slate-400" /><h3 className="text-xs font-black uppercase text-slate-400">Return Time</h3></div>
        {weather && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold">Return Est: {weather.returnTime.feels_like}°C</span>}
      </div>
      <select value={returnTime} onChange={(e) => setReturnTime(e.target.value)}
        className="w-full p-4 bg-slate-50 border-none rounded-xl outline-none text-sm font-bold cursor-pointer">
        <option value="17:00">17:00 (Sunset)</option>
        <option value="20:00">20:00 (Evening)</option>
        <option value="23:00">23:00 (Night)</option>
      </select>
    </Card>

    {recommendation && (
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Daily Setup</h3>
        {recommendation.statusNote && (
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 text-blue-800 text-[11px] font-bold">
            <Zap size={14} className="shrink-0" /> {recommendation.statusNote}
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-transform active:scale-95">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600"><Shirt size={22} /></div>
            <div><p className="text-[9px] font-black uppercase text-slate-400">Base</p><p className="font-bold text-sm">{recommendation.base}</p></div>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-transform active:scale-95">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600"><Pants size={22} /></div>
            <div><p className="text-[9px] font-black uppercase text-slate-400">Bottom</p><p className="font-bold text-sm">{recommendation.bottom}</p></div>
          </div>
          {recommendation.outer && (
            <div className="flex items-center gap-4 bg-black text-white p-4 rounded-2xl shadow-lg transition-transform active:scale-95">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Wind size={22} /></div>
              <div><p className="text-[9px] font-black uppercase text-white/50">Outer (Required)</p><p className="font-bold text-sm">{recommendation.outer}</p></div>
            </div>
          )}
        </div>
        <p className="text-center italic text-slate-300 text-[10px] px-8 mt-4 tracking-wide">" {recommendation.desc} "</p>
      </div>
    )}
  </div>
);
