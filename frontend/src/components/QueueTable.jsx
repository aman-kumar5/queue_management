import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Clock } from 'lucide-react';

const tableRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    x: 10, 
    transition: { duration: 0.2 } 
  }
};

function QueueTable({ patients }) {
  // Filter for waiting and in_consultation patients
  const activePatients = patients.filter(
    (p) => p.status === 'waiting' || p.status === 'in_consultation'
  );

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-650" />
          Active Queue List
        </h3>
        <span className="text-slate-655 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
          {activePatients.length} Active
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold tracking-wider uppercase bg-slate-50/30">
              <th className="py-4 px-6 text-center w-24">Token</th>
              <th className="py-4 px-6">Patient Info</th>
              <th className="py-4 px-6">Phone</th>
              <th className="py-4 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            <AnimatePresence initial={false}>
              {activePatients.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan="4" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <User className="w-8 h-8 text-slate-300 animate-pulse-slow" />
                      <span>No Patients in Active Queue</span>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                activePatients.map((patient) => {
                  const isInConsultation = patient.status === 'in_consultation';
                  return (
                    <motion.tr
                      key={patient.id}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layoutId={`patient-row-${patient.id}`}
                      className={`hover:bg-slate-50/70 transition-colors duration-200 group ${
                        isInConsultation ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]' : ''
                      }`}
                    >
                      {/* Token Column */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm shadow-sm border ${
                          isInConsultation
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-250 shadow-emerald-500/5 text-glow-emerald'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}>
                          {patient.token_no}
                        </span>
                      </td>

                      {/* Name Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isInConsultation ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-600 transition-colors'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-800 text-sm group-hover:text-slate-900 transition-colors">
                            {patient.name}
                          </span>
                        </div>
                      </td>

                      {/* Phone Column */}
                      <td className="py-4 px-6 text-slate-500 text-sm font-medium">
                        {patient.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-800">{patient.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase border ${
                          isInConsultation
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-glow-emerald'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100 text-glow-indigo'
                        }`}>
                          {isInConsultation ? (
                            <>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>In Room</span>
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                              <span>Waiting</span>
                            </>
                          )}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QueueTable;
