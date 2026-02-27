import { useState } from 'react';
import {
  Trash2, CheckCircle2, ArrowRight, RefreshCw, Waves
} from 'lucide-react';
import { Card } from './Card';
import { DEFAULT_MAPPING } from '../constants';

export const TripTab = ({ trips, setTrips, inventory, preferences }) => {
  const [packingLoading, setPackingLoading] = useState(false);
  const [packingResult, setPackingResult] = useState(null);

  const handleTripUpdate = (id, field, value) => {
    const updated = trips.map(t => t.id === id ? { ...t, [field]: value } : t);
    setTrips(updated);
  };

  const addTrip = () => {
    const last = trips[trips.length - 1];
    const start = last?.endDate || new Date().toISOString().split('T')[0];
    const n = [...trips, { id: Date.now(), location: "", startDate: start, endDate: start }];
    setTrips(n);
  };

  const removeTrip = (id) => {
    setTrips(trips.filter(x => x.id !== id));
  };

  const calculatePacking = async () => {
    setPackingLoading(true);
    const total = { base_short: 0, base_long: 0, bottom_light: 0, bottom_heavy: 0, outer_light: 0, outer_heavy: 0, underwear: 0, socks: 0 };
    const breakdown = [];
    try {
      for (const t of trips) {
        const diff = new Date(t.endDate) - new Date(t.startDate);
        const d = diff < 0 ? 0 : Math.ceil(diff / 86400000) + 1;
        if (d <= 0 || !t.location) continue;
        const res = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(t.location)}&count=1`)).json();
        if (res.results) {
          const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${res.results[0].latitude}&longitude=${res.results[0].longitude}&current=temperature_2m`)).json();
          const temp = w.current.temperature_2m;
          const uT = preferences.upperSensitive ? temp - 3 : temp;
          const lT = preferences.lowerSensitive ? temp - 3 : temp;
          const uM = DEFAULT_MAPPING.find(x => uT >= x.min && uT < x.max) || DEFAULT_MAPPING[2];
          const lM = DEFAULT_MAPPING.find(x => lT >= x.min && lT < x.max) || DEFAULT_MAPPING[2];
          const needs = { base_short: 0, base_long: 0, bottom_light: 0, bottom_heavy: 0, outer_light: 0, outer_heavy: 0, underwear: d, socks: d };
          if (uM.base) needs[uM.base] = d;
          if (lM.bottom) needs[lM.bottom] = Math.ceil(d / 2);
          if (uM.outer) needs[uM.outer] = 1;
          breakdown.push({ location: t.location, days: d, temp: Math.round(temp), needs });
          Object.keys(needs).forEach(k => {
            if (k.startsWith('outer')) total[k] = Math.max(total[k], needs[k]);
            else total[k] += needs[k];
          });
        }
      }
      const shortage = Object.keys(total).filter(k => total[k] > (inventory[k]?.count || 0)).map(k => ({ label: inventory[k].label, diff: total[k] - inventory[k].count }));
      setPackingResult({ total, breakdown, shortage });
    } finally { setPackingLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-black px-1">Packing Checklist</h2>
      <div className="space-y-4">
        {trips.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <input placeholder="Destination?" className="bg-transparent text-lg font-black outline-none italic flex-1" value={t.location} onChange={(e) => handleTripUpdate(t.id, 'location', e.target.value)} />
              <button onClick={() => removeTrip(t.id)} className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <input type="date" className="flex-1 bg-white border border-slate-100 p-2 rounded-lg text-xs font-bold outline-none" value={t.startDate} onChange={(e) => handleTripUpdate(t.id, 'startDate', e.target.value)} />
                <ArrowRight size={14} className="text-slate-300" />
                <input type="date" className="flex-1 bg-white border border-slate-100 p-2 rounded-lg text-xs font-bold outline-none" value={t.endDate} onChange={(e) => handleTripUpdate(t.id, 'endDate', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addTrip} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase hover:border-black hover:text-black transition-all">+ Add Next Destination</button>
      </div>
      <button onClick={calculatePacking} disabled={packingLoading || trips.length === 0} className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {packingLoading ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Generate Summary
      </button>
      {packingResult && (
        <div className="space-y-6">
          {packingResult.shortage.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
              <Waves className="text-amber-600 shrink-0" size={20} />
              <div className="space-y-1">
                <p className="text-sm font-black text-amber-900 uppercase">Laundry Warning</p>
                <p className="text-xs text-amber-700">Missing: {packingResult.shortage.map(s => `${s.label} (-${s.diff})`).join(', ')}</p>
              </div>
            </div>
          )}
          <Card className="bg-slate-900 text-white border-none space-y-6">
            <div className="grid grid-cols-2 gap-y-4 gap-x-10">
              {Object.entries(packingResult.total).map(([k, v]) => (v > 0 && inventory[k]) && (
                <div key={k} className="flex justify-between border-b border-white/5 pb-2 text-xs font-medium">
                  <span className="text-white/40">{inventory[k].label}</span><span className="font-black">x{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
