import { Zap } from 'lucide-react';
import { Card } from './Card';

export const SettingsTab = ({ preferences, setPreferences, inventory, setInventory }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-black px-1">Personal Settings</h2>
    <Card className="space-y-6">
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Zap size={10} /> Cold Sensitivity</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm font-bold text-slate-700">Upper Body sensitive to cold</span>
            <input type="checkbox" checked={preferences.upperSensitive} onChange={(e) => setPreferences({...preferences, upperSensitive: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-black focus:ring-black" />
          </label>
          <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm font-bold text-slate-700">Lower Body sensitive to cold</span>
            <input type="checkbox" checked={preferences.lowerSensitive} onChange={(e) => setPreferences({...preferences, lowerSensitive: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-black focus:ring-black" />
          </label>
        </div>
      </div>
    </Card>

    <h2 className="text-2xl font-black px-1">Wardrobe Assets</h2>
    <Card className="p-0 overflow-hidden border-none shadow-xl">
      <div className="divide-y divide-slate-50">
        {Object.entries(inventory).map(([k, v]) => (
          <div key={k} className="flex justify-between items-center p-5">
            <span className="text-sm font-bold text-slate-700">{v.label}</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setInventory({...inventory, [k]: {...v, count: Math.max(0, v.count - 1)}})} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">-</button>
              <span className="w-4 text-center font-black">{v.count}</span>
              <button onClick={() => setInventory({...inventory, [k]: {...v, count: v.count + 1}})} className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-xl font-bold shadow-lg">+</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);
