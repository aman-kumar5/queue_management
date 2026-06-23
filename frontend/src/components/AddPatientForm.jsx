import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { createPatient } from '../services/api';

function AddPatientForm({ onPatientAdded }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Patient name is required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessInfo(null);

    try {
      const result = await createPatient(name.trim(), phone.trim());
      setSuccessInfo(result);
      setName('');
      setPhone('');
      if (onPatientAdded) {
        onPatientAdded();
      }
      
      // Auto clear success notice after 5 seconds
      setTimeout(() => {
        setSuccessInfo(null);
      }, 5000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate token. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border-indigo-500/10">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-550 via-purple-550 to-pink-550" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <UserPlus className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-slate-900">Add New Patient</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="patient-name" className="block text-slate-600 text-xs font-bold tracking-wider uppercase mb-1.5">
            Patient Name <span className="text-pink-500">*</span>
          </label>
          <input
            id="patient-name"
            type="text"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
          />
        </div>

        <div>
          <label htmlFor="patient-phone" className="block text-slate-600 text-xs font-bold tracking-wider uppercase mb-1.5">
            Phone Number (Optional)
          </label>
          <input
            id="patient-phone"
            type="tel"
            placeholder="Enter 10-digit number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-pink-650 text-xs font-bold bg-pink-50 border border-pink-100 rounded-xl p-3"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-650/15 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Token</span>
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {successInfo && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-emerald-700 font-bold text-sm">Token Generated Successfully</h4>
              <p className="text-slate-600 text-xs mt-1">
                Patient: <span className="text-slate-900 font-bold">{successInfo.name}</span>
              </p>
              <p className="text-emerald-600 font-black text-2xl mt-1 text-glow-emerald">
                Token Number: #{successInfo.token_no}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AddPatientForm;
