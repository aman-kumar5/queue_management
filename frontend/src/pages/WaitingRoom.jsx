import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getQueueStatus, getPatients, verifyPatient } from '../services/api';
import socket from '../socket/socket';
import TokenDisplay from '../components/TokenDisplay';
import PatientStatusChecker from '../components/PatientStatusChecker';
import { 
  Wifi, 
  WifiOff, 
  Tv, 
  Volume2, 
  VolumeX,
  LogOut,
  AlertCircle
} from 'lucide-react';

function WaitingRoom() {
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
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Voice calling is active by default
  const [session, setSession] = useState(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [needsActivation, setNeedsActivation] = useState(true);

  const prevTokenRef = useRef(0);

  // Live clock effect for waiting room display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle first interaction to activate speech synthesis
  useEffect(() => {
    const handleFirstInteraction = () => {
      setNeedsActivation(false);
      
      // Initialize/unlock speech synthesis
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
  const navigate = useNavigate();

  // Load session info on mount
  useEffect(() => {
    const sessionData = localStorage.getItem('queue_cure_session');
    if (sessionData) {
      try {
        setSession(JSON.parse(sessionData));
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    }
  }, []);

  // Check if patient is still active in database
  const checkPatientStatus = async (currentSession) => {
    if (!currentSession || currentSession.role !== 'patient') return;

    try {
      const patientId = currentSession.patient?.id;
      if (!patientId) return;

      const result = await verifyPatient(patientId);
      if (!result.active) {
        // Patient has been completed, skipped, or database was reset
        setShowLogoutAlert(true);
        setTimeout(() => {
          localStorage.removeItem('queue_cure_session');
          navigate('/login');
        }, 4000);
      }
    } catch (error) {
      console.error('Error verifying patient status:', error);
    }
  };

  // Fetch queue data
  const fetchData = async (currentSession) => {
    try {
      const currentStatus = await getQueueStatus();
      const patientList = await getPatients();
      setStatus(currentStatus);
      setPatients(patientList);

      // Trigger verification for patients
      if (currentSession) {
        await checkPatientStatus(currentSession);
      }
      
      // Voice announce if token changed
      const newToken = currentStatus.currentToken;
      if (newToken > 0 && newToken !== prevTokenRef.current) {
        announceToken(newToken, patientList);
        prevTokenRef.current = newToken;
      }
    } catch (error) {
      console.error('Error fetching waiting room data:', error);
    }
  };

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

  useEffect(() => {
    // 1. Load session and do initial fetch
    const sessionData = localStorage.getItem('queue_cure_session');
    let parsedSession = null;
    if (sessionData) {
      try {
        parsedSession = JSON.parse(sessionData);
      } catch (e) {}
    }

    fetchData(parsedSession);

    // 2. Listen to socket updates
    const handleUpdate = () => {
      console.log('Socket received: queueUpdated. Refetching waiting room data.');
      fetchData(parsedSession);
    };

    socket.on('queueUpdated', handleUpdate);

    // 3. Connection handlers
    const handleConnect = () => {
      setIsConnected(true);
      setShowStatusAlert(true);
      setTimeout(() => setShowStatusAlert(false), 3000);
      fetchData(parsedSession);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setShowStatusAlert(true);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    setIsConnected(socket.connected);

    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      socket.off('queueUpdated', handleUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [isMuted]);

  const handleLogout = () => {
    localStorage.removeItem('queue_cure_session');
    navigate('/login');
  };

  // Upcoming patients list (waiting list in ascending order of token)
  const upcomingPatients = patients
    .filter((p) => p.status === 'waiting')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col relative overflow-x-hidden">
      {/* Calming background drifting elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none calm-drift-slow" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/[0.03] rounded-full blur-[120px] pointer-events-none calm-drift-medium" />

      {/* Screen Header */}
      <header className="border-b border-[#EDE8E0] bg-white/60 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-555 bg-opacity-10 text-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/[0.02]">
              <Tv className="w-5 h-5 animate-pulse-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Waiting Room Display</h1>
              <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-0.5 flex items-center gap-2">
                <span>Live Token Tracker</span>
                <span className="text-slate-300 font-normal">•</span>
                <span className="text-indigo-600 font-extrabold font-mono tracking-normal">{currentTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle Button */}
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (isMuted && status.currentToken > 0) {
                  setTimeout(() => announceToken(status.currentToken, patients), 200);
                }
              }}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2 text-xs font-bold ${
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

            {/* Network Indicator */}
            <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors duration-300 ${
              isConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-pink-50 text-pink-700 border-pink-200'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs p-2.5 rounded-xl transition-all flex items-center justify-center"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8 z-20">
        
        {/* Left Column: Serving Token Card */}
        <div className="lg:col-span-2 space-y-8">
          <TokenDisplay status={status} session={session} patients={patients} />

          {/* Interactive lookup tool */}
          <PatientStatusChecker patients={patients} averageTime={status.averageConsultationTime} />
        </div>

        {/* Right Column: Upcoming Queue list */}
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="glass-panel rounded-3xl p-6 flex flex-col h-full border-slate-200 bg-white/40">
            <h3 className="text-lg font-black text-slate-900 mb-4 border-b border-slate-200 pb-3 flex items-center justify-between">
              <span>Upcoming Tokens</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next in Line</span>
            </h3>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {upcomingPatients.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm italic font-medium"
                  >
                    No upcoming tokens
                  </motion.div>
                ) : (
                  upcomingPatients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-650 font-black text-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-colors duration-300">
                          {patient.token_no}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-slate-950 transition-colors">
                            {patient.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Position: #{index + 1}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                        <span>~{index * status.averageConsultationTime} mins</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            
            {/* Queue Summary footer card */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Avg consult: {status.averageConsultationTime} mins</span>
            </div>
          </div>
        </div>
      </main>

      {/* Reconnecting Overlay Modal Banner (Condition 6) */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6"
          >
            <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-8 text-center space-y-6 shadow-2xl">
              <div className="relative flex h-12 w-12 mx-auto justify-center items-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <div className="p-3 rounded-full bg-pink-50 text-pink-600 relative">
                  <WifiOff className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Reconnecting...</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  Lost connection to the clinic's server. Check your internet connection or wait as we attempt to reconnect automatically.
                </p>
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                Socket Status: DISCONNECTED
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected Alert Slide-in Notification */}
      <AnimatePresence>
        {showStatusAlert && isConnected && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xs px-4"
          >
            <div className="bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center justify-center gap-2">
              <Wifi className="w-4 h-4" />
              <span>Connection Restored Successfully</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Expired / Logged Out Alert (Queue Reset Notification) */}
      <AnimatePresence>
        {showLogoutAlert && (
          <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-pink-200 rounded-3xl max-w-sm w-full p-8 text-center space-y-5 shadow-2xl"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-pink-50 text-pink-650 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Session Expired</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  Today's queue has been completed or reset by the receptionist. Your token is no longer active. You are being redirected...
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Autoplay Unlock Banner */}
      <AnimatePresence>
        {needsActivation && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none"
          >
            <div className="bg-indigo-600 text-white font-bold text-sm px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-indigo-500/30 backdrop-blur-md bg-opacity-95">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-white animate-bounce">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Audio Calling Enabled</h4>
                  <p className="text-indigo-200 text-[10px] mt-0.5 font-bold uppercase tracking-wider">Tap anywhere to initialize speaker</p>
                </div>
              </div>
              <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">Tap Screen</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WaitingRoom;
