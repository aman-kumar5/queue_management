import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Info, CheckCircle, AlertTriangle, PlayCircle } from 'lucide-react';

function PatientStatusChecker({ patients, averageTime }) {
  const [tokenInput, setTokenInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const tokenNo = parseInt(tokenInput, 10);
    setSearched(true);

    if (isNaN(tokenNo) || tokenNo <= 0) {
      setSearchResult(null);
      return;
    }

    const patient = patients.find((p) => p.token_no === tokenNo);

    if (!patient) {
      setSearchResult({ found: false, tokenNo });
      return;
    }

    // Calculate people ahead
    const peopleAhead = patients.filter(
      (p) => p.status === 'waiting' && p.token_no < patient.token_no
    ).length;

    const estimatedWait = peopleAhead * averageTime;

    setSearchResult({
      found: true,
      patient,
      peopleAhead,
      estimatedWait,
    });
  };

  const handleReset = () => {
    setTokenInput('');
    setSearchResult(null);
    setSearched(false);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 bg-white/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <Search className="w-4 h-4" />
        </div>
        <h3 className="text-md font-black text-slate-900 tracking-wide">
          Check Your Token Status
        </h3>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="number"
          min="1"
          placeholder="Enter your token number (e.g. 5)"
          value={tokenInput}
          onChange={(e) => {
            setTokenInput(e.target.value);
            if (searched) setSearched(false);
          }}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.02]"
        >
          Check
        </button>
      </form>

      <AnimatePresence mode="wait">
        {searched && searchResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80"
          >
            {searchResult.found ? (
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Patient
                    </p>
                    <h4 className="text-slate-800 font-black text-sm mt-0.5">
                      {searchResult.patient.name}
                    </h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                    searchResult.patient.status === 'in_consultation'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : searchResult.patient.status === 'waiting'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-150'
                      : searchResult.patient.status === 'completed'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {searchResult.patient.status === 'in_consultation' ? 'In consultation' : searchResult.patient.status}
                  </span>
                </div>

                {searchResult.patient.status === 'waiting' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">People Ahead:</span>
                      <span className="text-indigo-600 font-extrabold text-sm text-glow-indigo">
                        {searchResult.peopleAhead} {searchResult.peopleAhead === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Estimated Wait:</span>
                      <span className="text-amber-600 font-extrabold text-sm text-glow-indigo">
                        ~{searchResult.estimatedWait} minutes
                      </span>
                    </div>
                  </div>
                )}

                {searchResult.patient.status === 'in_consultation' && (
                  <div className="flex gap-2.5 items-start text-xs text-emerald-755 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <PlayCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 text-glow-emerald" />
                    <div>
                      <p className="font-bold text-emerald-800">It's your turn!</p>
                      <p className="text-slate-600 mt-0.5 font-medium">Please proceed to the doctor's room immediately.</p>
                    </div>
                  </div>
                )}

                {searchResult.patient.status === 'completed' && (
                  <div className="flex gap-2.5 items-start text-xs text-slate-500 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-slate-400" />
                    <div>
                      <p className="font-bold text-slate-700">Consultation Completed</p>
                      <p className="text-slate-500 mt-0.5 font-medium">Your visit is finished. Have a healthy day!</p>
                    </div>
                  </div>
                )}

                {searchResult.patient.status === 'skipped' && (
                  <div className="flex gap-2.5 items-start text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500 text-glow-purple" />
                    <div>
                      <p className="font-bold text-amber-800">Token Skipped</p>
                      <p className="text-slate-600 mt-0.5 font-medium">You were not present when called. Please speak with the receptionist.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2.5 items-start text-xs text-slate-500">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-700">Token #{searchResult.tokenNo} Not Found</p>
                  <p className="text-slate-450 mt-0.5 font-medium">
                    No active record found for this token number today. Please verify or register at reception.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="mt-3.5 w-full text-center text-xs text-slate-450 hover:text-indigo-600 font-bold py-1 transition-colors"
            >
              Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PatientStatusChecker;
