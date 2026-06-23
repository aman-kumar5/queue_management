import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getQueueStatus, 
  getPatients, 
  callNext, 
  markCompleted, 
  skipCurrent, 
  resetQueue 
} from '../services/api';
import socket from '../socket/socket';
import StatsCards from '../components/StatsCards';
import AddPatientForm from '../components/AddPatientForm';
import QueueSettings from '../components/QueueSettings';
import QueueTable from '../components/QueueTable';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Play, 
  CheckCircle, 
  SkipForward, 
  RefreshCw,
  LogOut,
  Volume2,
  VolumeX
} from 'lucide-react';

function ReceptionistDashboard() {
  const [status, setStatus] = useState({
    currentToken: 0,
    nextToken: 1,
    averageConsultationTime: 10,
    patientsServed: 0,
    patientsWaiting: 0,
    estimatedWait: 0
  });
  const [patients, setPatients] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [actionLoading, setActionLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const prevTokenRef = useRef(0);
  
  const navigate = useNavigate();

  // Fetch all initial data
  const fetchData = async () => {
    try {
      const currentStatus = await getQueueStatus();
      const patientList = await getPatients();
      setStatus(currentStatus);
      setPatients(patientList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    // 1. Initial fetch
    fetchData();

    // 2. Listen to socket updates
    const handleUpdate = () => {
      console.log('Socket received: queueUpdated. Refetching dashboard data.');
      fetchData();
    };

    socket.on('queueUpdated', handleUpdate);

    // 3. Connection status logs
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Force connection state on mount
    setIsConnected(socket.connected);

    return () => {
      socket.off('queueUpdated', handleUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Text to speech announcement
  const announceToken = (tokenNumber, patientList) => {
    if (isMuted) return;

    try {
      const currentPatient = patientList.find(p => p.token_no === tokenNumber);
      const nameAnnouncement = currentPatient ? `, ${currentPatient.name}` : '';
      const text = `Token number ${tokenNumber}${nameAnnouncement}, please proceed to the doctor's room.`;
      
      window.speechSynthesis?.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis?.getVoices();
      if (voices && voices.length > 0) {
        const englishVoice = voices.find(v => v.lang.includes('en') && v.name.toLowerCase().includes('google')) || 
                             voices.find(v => v.lang.includes('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
      
      window.speechSynthesis?.speak(utterance);
    } catch (e) {
      console.error('Text to speech failed:', e);
    }
  };

  // Autoplay voice call unlock listener on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Speak when current token changes
  useEffect(() => {
    const newToken = status.currentToken;
    if (newToken > 0 && newToken !== prevTokenRef.current) {
      announceToken(newToken, patients);
      prevTokenRef.current = newToken;
    }
  }, [status.currentToken, patients, isMuted]);

  const handleAction = async (actionFn) => {
    setActionLoading(true);
    try {
      await actionFn();
    } catch (error) {
      console.error(`Action failed:`, error);
      alert(error.response?.data?.error || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetConfirm = async () => {
    setShowResetConfirm(false);
    handleAction(resetQueue);
  };

  const handleLogout = () => {
    localStorage.removeItem('queue_cure_session');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col relative overflow-hidden">
      {/* Background glow blur */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none calm-drift-slow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/[0.03] rounded-full blur-[120px] pointer-events-none calm-drift-medium" />

      {/* Header */}
      <header className="border-b border-[#EDE8E0] bg-white/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/15 animate-pulse-slow">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">Queue Cure</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Reception Desk Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Socket Status Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors duration-300 ${
              isConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-pink-50 text-pink-700 border-pink-200 animate-pulse'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Disconnected</span>
                </>
              )}
            </div>

            {/* Waiting room display redirect link */}
            <Link 
              to="/waiting-room" 
              target="_blank"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              Patient Screen
            </Link>

            {/* Audio Toggle Button */}
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (isMuted && status.currentToken > 0) {
                  setTimeout(() => announceToken(status.currentToken, patients), 200);
                }
              }}
              className={`p-2 rounded-xl border transition-all duration-300 flex items-center gap-2 text-xs font-bold ${
                isMuted
                  ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800'
                  : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
              }`}
              title={isMuted ? "Unmute Voice Announcements" : "Mute Voice Announcements"}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden sm:inline">Voice Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-glow-indigo animate-bounce" />
                  <span className="hidden sm:inline">Voice Active</span>
                </>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="bg-pink-50 hover:bg-pink-100 text-pink-650 border border-pink-100 font-bold text-xs p-2 rounded-xl transition-all flex items-center justify-center"
              title="Logout Receptionist"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full space-y-8 z-10">
        
        {/* Statistics Cards */}
        <StatsCards status={status} />

        {/* Action Controls & Forms Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Input fields and configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Patient Card */}
            <AddPatientForm onPatientAdded={fetchData} />

            {/* Average time settings */}
            <QueueSettings 
              currentAverageTime={status.averageConsultationTime} 
              onSettingsUpdated={fetchData} 
            />
          </div>

          {/* Right: Quick actions and patient table list */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />
              <h3 className="text-md font-black text-slate-900 mb-4">Quick Operations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleAction(callNext)}
                  disabled={actionLoading || status.patientsWaiting === 0}
                  className={`flex items-center justify-center gap-2 font-bold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02] ${
                    status.patientsWaiting === 0
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-550 text-white shadow-emerald-600/10'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Call Next Patient
                </button>

                <button
                  onClick={() => handleAction(markCompleted)}
                  disabled={actionLoading || status.currentToken === 0}
                  className={`flex items-center justify-center gap-2 font-bold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02] ${
                    status.currentToken === 0
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-550 text-white shadow-indigo-600/10'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Completed
                </button>

                <button
                  onClick={() => handleAction(skipCurrent)}
                  disabled={actionLoading || (status.currentToken === 0 && status.patientsWaiting === 0)}
                  className={`flex items-center justify-center gap-2 font-bold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02] ${
                    status.currentToken === 0 && status.patientsWaiting === 0
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-amber-600 hover:bg-amber-555 hover:bg-amber-550 text-white shadow-amber-600/10'
                  }`}
                >
                  <SkipForward className="w-4 h-4" />
                  Skip Current / Next
                </button>
              </div>

              {/* Reset Day Queue Button */}
              <div className="border-t border-slate-200 mt-5 pt-4 flex justify-between items-center">
                <div>
                  <h4 className="text-slate-700 text-xs font-bold">End Clinic Day</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5">Clears all patients and restarts token sequence from 1.</p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="bg-transparent hover:bg-pink-50 text-pink-650 border border-pink-200 hover:border-pink-300 font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Today's Queue
                </button>
              </div>
            </div>

            {/* Waiting Queue List */}
            <QueueTable patients={patients} />
          </div>

        </div>
      </main>

      {/* Reset Confirmation Overlay Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-center space-y-6 shadow-2xl"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin-slow" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Reset Clinic Queue?</h3>
                <p className="text-slate-500 text-sm leading-normal">
                  This action is irreversible. All patient registration records will be wiped out and the next token number will reset to 1.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl border border-slate-250 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetConfirm}
                  className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-pink-600/10"
                >
                  Reset Queue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReceptionistDashboard;
