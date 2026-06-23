import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Users, Hourglass } from 'lucide-react';

function TokenDisplay({ status, session, patients }) {
  const { currentToken, patientsWaiting, estimatedWait } = status;
  const [pulse, setPulse] = useState(false);

  const isPatient = session && session.role === 'patient';
  const myToken = session?.patient?.token_no;
  const myName = session?.patient?.name;
  
  // Calculate patients ahead in the queue (status = 'waiting' and token_no < myToken)
  const patientsAhead = isPatient && patients && myToken
    ? patients.filter(p => p.status === 'waiting' && p.token_no < myToken).length
    : 0;

  const myWaitTime = patientsAhead * (status.averageConsultationTime || 10);

  // Trigger pulse animation when currentToken changes to draw attention
  useEffect(() => {
    if (currentToken !== undefined) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentToken]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Massive Now Serving Panel */}
      <motion.div
        layout
        className="lg:col-span-2 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border-indigo-200/50 bg-gradient-to-br from-white via-white to-indigo-50/20"
      >
        {/* Decorative glowing background */}
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        
        {/* Animated glowing border ring */}
        <AnimatePresence>
          {pulse && (
            <motion.div
              initial={{ opacity: 0.8, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-0 border-4 border-indigo-500 rounded-3xl pointer-events-none"
            />
          )}
        </AnimatePresence>

        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 font-bold text-xs tracking-widest uppercase mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-505"></span>
          </span>
          Now Serving
        </span>

        <h1 className="text-slate-500 font-extrabold text-sm uppercase tracking-wider">
          Token Number
        </h1>

        <motion.div
          key={currentToken}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="my-4 relative"
        >
          {currentToken > 0 ? (
            <div className="text-[9rem] sm:text-[12rem] font-black text-slate-900 leading-none tracking-tighter text-glow-indigo filter drop-shadow-[0_0_20px_rgba(99,102,241,0.08)]">
              {currentToken}
            </div>
          ) : (
            <div className="text-3xl sm:text-4xl font-black text-slate-400 py-10 max-w-sm mx-auto">
              Clinic is Ready
              <p className="text-slate-500 text-sm font-medium mt-2">No Patients in Queue</p>
            </div>
          )}
        </motion.div>

        <p className="text-slate-400 text-sm font-semibold">
          Please proceed to the doctor's consultation room.
        </p>

        {isPatient && (
          <div className={`mt-6 px-5 py-3.5 rounded-2xl border text-xs font-bold w-full max-w-md shadow-sm transition-all duration-300 ${
            currentToken === myToken 
              ? 'bg-emerald-50 border-emerald-250 text-emerald-800 animate-pulse' 
              : 'bg-indigo-50/70 border-indigo-150 text-slate-700'
          }`}>
            {currentToken === myToken ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-emerald-650 font-extrabold text-sm uppercase tracking-wide">🎉 It's Your Turn!</span>
                <span>Hello {myName}, please proceed to the doctor's consultation room now.</span>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span>Hello, <span className="font-extrabold text-slate-900">{myName}</span></span>
                <div className="flex gap-3">
                  <span>Your Token: <span className="font-extrabold text-indigo-650 font-mono">#{myToken}</span></span>
                  <span className="text-slate-300">|</span>
                  <span>Est. Wait: <span className="font-extrabold text-indigo-650">~{myWaitTime} mins</span></span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Side stats: Patients Waiting & Estimated Wait */}
      <div className="flex flex-col gap-6">
        {/* Patients Waiting Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex-1 glass-panel rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative border-emerald-100"
        >
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/[0.04] rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Patients Waiting
            </span>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-6xl font-black text-emerald-600 text-glow-emerald leading-none">
              {patientsWaiting}
            </span>
            <p className="text-slate-400 text-[11px] mt-2 font-medium">
              Patients currently in the queue
            </p>

            {isPatient && (
              <div className="mt-3 pt-3 border-t border-slate-200/50 text-[11px] font-semibold text-indigo-650 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Your Token:</span>
                  <span className="font-extrabold text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-mono">#{myToken}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Queue Position:</span>
                  <span className="font-bold text-slate-800">{patientsAhead + 1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Your Est. Wait:</span>
                  <span className="font-extrabold text-slate-800">~{myWaitTime} mins</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Estimated Wait Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex-1 glass-panel rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative border-amber-100"
        >
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-500/[0.04] rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Estimated Wait
            </span>
            <div className="p-3 rounded-2xl bg-amber-550 bg-opacity-10 text-amber-600">
              <Hourglass className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-6xl font-black text-amber-600 text-glow-indigo leading-none">
              {estimatedWait}
            </span>
            <span className="text-2xl font-black text-amber-600 ml-1">mins</span>
            <p className="text-slate-400 text-[11px] mt-2 font-medium">
              Until today's queue is cleared
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default TokenDisplay;
