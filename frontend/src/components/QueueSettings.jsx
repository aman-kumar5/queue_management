import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Clock, Check } from 'lucide-react';
import { updateAverageTime } from '../services/api';

function QueueSettings({ currentAverageTime, onSettingsUpdated }) {
  const [time, setTime] = useState(10);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (currentAverageTime) {
      setTime(currentAverageTime);
    }
  }, [currentAverageTime]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isNaN(time) || time < 1) return;

    setLoading(true);
    setUpdated(false);

    try {
      await updateAverageTime(time);
      setUpdated(true);
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
      setTimeout(() => setUpdated(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-555 bg-opacity-10 text-indigo-600">
          <Settings className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Queue Settings</h2>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label htmlFor="avg-time" className="block text-slate-600 text-xs font-bold tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-450" />
            Average Consultation Time (mins)
          </label>
          <div className="flex gap-2">
            <input
              id="avg-time"
              type="number"
              min="1"
              value={time}
              onChange={(e) => setTime(Math.max(1, parseInt(e.target.value, 10) || 0))}
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={loading || time === currentAverageTime}
              className={`px-5 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] ${
                time === currentAverageTime
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                  : 'bg-indigo-600 hover:bg-indigo-550 text-white shadow-indigo-600/15'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : updated ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {updated && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-emerald-650 text-xs font-semibold"
            >
              Average consultation time updated successfully!
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

export default QueueSettings;
