import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile // NEW: Import updateProfile
} from 'firebase/auth';
// NEW: Import setDoc and getDoc
import { collection, addDoc, doc, updateDoc as updateFirestoreDoc, onSnapshot, query, setDoc, getDoc } from 'firebase/firestore';
import { Home, CalendarPlus, MessageSquare, ListChecks, UserCircle, XCircle, Send, PlusCircle, Trash2, LogOut, CheckCircle, AlertTriangle, Info, Settings, Volume2, Eye, Moon, Sun, ZoomIn, ZoomOut, FileText, Activity, BookOpen, Search, MapPin, Menu, ChevronRight, ShieldCheck, FileBarChart2, Stethoscope, School, Mail, KeyRound, User, Hash, CalendarDays, MapPinned, Phone } from 'lucide-react';

import { auth, db, customAppId } from './firebaseConfig.js';
import {
  MOCK_PRESCRIPTIONS, MOCK_DOCTORS, MOCK_LAB_RESULTS, MOCK_MEDICAL_HISTORY, MOCK_EDUCATIONAL_RESOURCES, MOCK_CLINICS
} from './mockData.js';

// --- Helper Components (Modal, Notification, SpeakButton, AccessibilitySettingsModal) ---
// ... (These components remain unchanged) ...
const Modal = ({ isOpen, onClose, title, children, darkMode, highContrast, fontSizeClass }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className={`rounded-lg shadow-xl p-6 w-full max-w-md ${fontSizeClass} ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} ${highContrast ? (darkMode ? 'border-2 border-yellow-400' : 'border-2 border-blue-600') : ''}`}>
    <div className="flex justify-between items-center mb-4">
    <h3 className={`text-xl font-semibold ${highContrast && darkMode ? 'text-yellow-300' : highContrast ? 'text-blue-700' : (darkMode ? 'text-white' : 'text-gray-800')}`}>{title}</h3>
    <button onClick={onClose} className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}> <XCircle size={24} /> </button>
    </div>
    <div>{children}</div>
    </div>
    </div>
  );
};

const Notification = ({ message, type, onDismiss, darkMode }) => {
  if (!message) return null;
  let bgColor; if (darkMode) { bgColor = type === 'success' ? 'bg-green-700' : type === 'error' ? 'bg-red-700' : 'bg-blue-700'; } else { bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'; }
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  return ( <div className={`fixed top-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-md flex items-center z-[100]`}> <Icon size={24} className="mr-3" /> <span>{message}</span> {onDismiss && ( <button onClick={onDismiss} className="ml-4 text-white hover:text-gray-200"> <XCircle size={20} /> </button> )} </div> );
};

const SpeakButton = ({ textToSpeak, darkMode, highContrast }) => {
  const handleSpeak = (e) => { e.stopPropagation(); if ('speechSynthesis' in window && textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); } else { console.warn("Speech synthesis not supported or no text to speak."); } };
  return ( <button onClick={handleSpeak} aria-label={`Speak: ${textToSpeak.substring(0,30)}...`} title="Read aloud" className={`ml-2 p-1 rounded ${darkMode ? (highContrast ? 'bg-yellow-500 text-black' : 'bg-gray-600 hover:bg-gray-500') : (highContrast ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300') }`}> <Volume2 size={16} /> </button> );
};

const AccessibilitySettingsModal = ({ isOpen, onClose, settings, updateSettings, darkMode, highContrast, fontSizeClass }) => {
  const { fontSize, highContrast: hc, darkMode: dm, talkbackEnabled } = settings;
  const fontSizes = [ { label: 'Normal', value: 'text-base' }, { label: 'Grande', value: 'text-lg' }, { label: 'Extra Grande', value: 'text-xl' }, ];
  return ( <Modal isOpen={isOpen} onClose={onClose} title="Opciones de accesibilidad" darkMode={darkMode} highContrast={highContrast} fontSizeClass={fontSizeClass}> <div className="space-y-6"> <div> <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Tamaño de letra</h4> <div className="flex space-x-2"> {fontSizes.map(fs => ( <button key={fs.value} onClick={() => updateSettings('fontSize', fs.value)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${fontSize === fs.value ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')} ${highContrast && fontSize === fs.value ? (darkMode ? 'border-2 border-yellow-400' : 'border-2 border-blue-800') : ''} ${highContrast && fontSize !== fs.value ? (darkMode ? 'border border-gray-500' : 'border border-gray-400') : ''} `}> {fs.label} </button> ))} </div> </div> <div> <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Tema</h4> <button onClick={() => updateSettings('darkMode', !dm)} className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${dm ? (highContrast ? 'bg-gray-900 text-yellow-300 border-2 border-yellow-400' : 'bg-gray-700 text-white') : (highContrast ? 'bg-white text-blue-700 border-2 border-blue-700' : 'bg-gray-200 text-black')} hover:${dm ? (highContrast ? 'bg-gray-800' : 'bg-gray-600') : (highContrast ? 'bg-gray-100' : 'bg-gray-300')} `}> {dm ? <Sun size={18} className="mr-2" /> : <Moon size={18} className="mr-2" />} {dm ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'} </button> </div> <div> <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Contraste</h4> <button onClick={() => updateSettings('highContrast', !hc)} className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${hc ? (darkMode ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')} ${highContrast && hc ? (darkMode ? 'border-2 border-white': 'border-2 border-black') : ''} `}> <Eye size={18} className="mr-2" /> {hc ? 'Deshabilitar Alto Contraste' : 'Habilitar Alto Contraste'} </button> </div> <div> <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Leer en voz alta (Simulación de TalkBack)</h4> <button onClick={() => updateSettings('talkbackEnabled', !talkbackEnabled)} className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${talkbackEnabled ? (darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')} ${highContrast && talkbackEnabled ? (darkMode ? 'border-2 border-white': 'border-2 border-black') : ''} `}> <Volume2 size={18} className="mr-2" /> {talkbackEnabled ? 'Deshabilitar Leer en Voz Alta' : 'Habilitar Leer en Voz Alta'} </button> {talkbackEnabled && <p className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>When enabled, look for <Volume2 size={12} className="inline" /> icons to have text read aloud.</p>} </div> </div> </Modal> );
};

// --- Screen Components (HomeScreen, AppointmentsScreen, etc.) ---
// ... ( Largely unchanged, HomeScreen will display the updated userName ) ...
const HomeScreen = ({ setCurrentPage, userName, userId, accessibilitySettings }) => {
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;
  // MODIFIED: Welcome message to use potentially full name
  const welcomeMessage = `Bienvenido, ${userName || 'User'}!`;
  const commonButtonClass = `p-4 rounded-lg shadow-md transition-all flex flex-col items-center justify-center aspect-square
  ${darkMode
    ? (highContrast ? 'bg-black text-yellow-300 border border-yellow-400 hover:bg-gray-900' : 'bg-gray-700 text-indigo-300 hover:bg-gray-600')
    : (highContrast ? 'bg-white text-blue-700 border border-blue-700 hover:bg-blue-50' : 'bg-white text-blue-600 hover:bg-blue-50')}
    `;

    const quickLinks = [
      { page: 'myAppointments', label: 'Mis citas', icon: CalendarPlus, speak: "Mis citas." },
      { page: 'chat', label: 'Habla con un doctor', icon: MessageSquare, speak: "Habla con un doctor." },
      { page: 'prescriptions', label: 'Mis recetas', icon: FileText, speak: "Mis recetas." },
      { page: 'labResults', label: 'Resultados de laboratorio', icon: FileBarChart2, speak: "Resultados de laboratorio." },
      { page: 'medicalHistory', label: 'Historial médico', icon: Activity, speak: "Historial médico." },
      { page: 'doctorFinder', label: 'Busca un hospital o clínica', icon: Stethoscope, speak: "Busca un hospital o clínica." },
      { page: 'educationalResources', label: 'Recursos informativos', icon: School, speak: "Recursos informativos." }
    ];

    return (
      <div className={`p-6 min-h-[calc(100vh-4rem)] flex flex-col items-center transition-colors duration-300
        ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}
        ${highContrast && darkMode ? 'border-2 border-yellow-400' : ''}
        ${highContrast && !darkMode ? 'bg-white text-black border-2 border-blue-700' : ''}
        `}>
        <UserCircle size={60} className={`mb-3 ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-indigo-300') : (highContrast ? 'text-blue-700' : 'text-indigo-200')}`} />
        <h1 className={`text-2xl font-bold mb-1 ${highContrast && !darkMode ? 'text-black' : ''}`}>{welcomeMessage}</h1>
        {talkbackEnabled && <SpeakButton textToSpeak={welcomeMessage} darkMode={darkMode} highContrast={highContrast} />}

        <p className={`mb-5 text-center text-sm ${darkMode ? (highContrast ? 'text-yellow-200' : 'text-indigo-100') : (highContrast ? 'text-gray-700' : 'text-indigo-100')}`}>¿Cómo podemos ayudarte hoy?</p>
        {talkbackEnabled && <SpeakButton textToSpeak="¿Cómo podemos ayudarte hoy?" darkMode={darkMode} highContrast={highContrast} />}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {quickLinks.map(item => (
          <button
          key={item.page}
          onClick={() => setCurrentPage(item.page)}
          className={commonButtonClass}
          aria-label={item.label}
          >
          <item.icon size={28} className="mb-1.5" />
          <span className="font-semibold text-center text-sm">{item.label}</span>
          {talkbackEnabled && <SpeakButton textToSpeak={item.speak || item.label} darkMode={darkMode} highContrast={highContrast} />}
          </button>
        ))}
        </div>
        </div>
    );
};

const AppointmentsScreen = ({ userId, showNotification, accessibilitySettings }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmCancelModal, setConfirmCancelModal] = useState({ isOpen: false, appointmentId: null });
  const [doctor, setDoctor] = useState(MOCK_DOCTORS[0]?.id || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const appointmentsCollectionPath = `artifacts/${customAppId}/users/${userId}/appointments`;


  useEffect(() => {
    if (!db || !userId) {
      setAppointments([]); // No mock data if not logged in/db not available for this screen
      setIsLoading(false); return;
    }
    setIsLoading(true);
    const q = query(collection(db, appointmentsCollectionPath));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userAppointments = []; querySnapshot.forEach((doc) => { userAppointments.push({ id: doc.id, ...doc.data() }); });
      userAppointments.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
      setAppointments(userAppointments); setIsLoading(false);
    }, (error) => { console.error("Error fetching appointments: ", error); showNotification("Error cargando citas.", "error"); setIsLoading(false); });
    return () => unsubscribe();
  }, [userId, showNotification, appointmentsCollectionPath]);

  const handleMakeAppointment = async (e) => {
    e.preventDefault(); if (!db || !userId) { showNotification("Database not available. Please login.", "error"); return; }
    if (!doctor || !date || !time || !reason) { showNotification("Please fill all fields.", "error"); return; }
    const newAppointment = { doctor: MOCK_DOCTORS.find(d => d.id === doctor)?.name || doctor, date, time, reason, status: 'Agendado', createdAt: new Date().toISOString() };
    try { await addDoc(collection(db, appointmentsCollectionPath), newAppointment); showNotification("Cita agendada con éxito", "success"); setDoctor(MOCK_DOCTORS[0]?.id || ''); setDate(''); setTime(''); setReason(''); setIsModalOpen(false); } catch (error) { console.error("Error añadiendo cita: ", error); showNotification("Fallo al agendar cita.", "error"); }
  };
  const confirmCancel = (appointmentId) => setConfirmCancelModal({ isOpen: true, appointmentId });
  const executeCancelAppointment = async () => {
    const appointmentId = confirmCancelModal.appointmentId; if (!db || !userId || !appointmentId) { showNotification("Database not available or invalid request.", "error"); setConfirmCancelModal({ isOpen: false, appointmentId: null }); return; }
    try { const appointmentRef = doc(db, appointmentsCollectionPath, appointmentId); await updateFirestoreDoc(appointmentRef, { status: 'Cancelado' }); showNotification("Cita cancelada con éxito.", "success"); } catch (error) { console.error("Error cancelando cita: ", error); showNotification("Fallo al cancelar cita.", "error"); }
    setConfirmCancelModal({ isOpen: false, appointmentId: null });
  };
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;
  return ( <div className={`p-4 min-h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} ${highContrast && darkMode ? 'border border-yellow-400' : ''} ${highContrast && !darkMode ? 'border border-blue-600' : ''}`}> <div className="flex justify-between items-center mb-6"> <h2 className={`text-2xl font-semibold ${highContrast && darkMode ? 'text-yellow-300' : highContrast ? 'text-blue-700' : ''}`}>Mis citas</h2> {talkbackEnabled && <SpeakButton textToSpeak="Mis citas page." darkMode={darkMode} highContrast={highContrast}/>} <button onClick={() => setIsModalOpen(true)} className={`font-semibold py-2 px-4 rounded-lg shadow-md flex items-center ${darkMode ? (highContrast ? 'bg-yellow-500 text-black hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700 text-white') : (highContrast ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600 text-white')} `}> <PlusCircle size={20} className="mr-2" /> Añadir cita </button> </div> {isLoading ? ( <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cargando citas...</p> ) : appointments.length === 0 ? ( <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No tienes citas pendientes.</p> ) : ( <div className="space-y-4"> {appointments.map(apt => ( <div key={apt.id} className={`p-4 rounded-lg shadow-md ${apt.status === 'Cancelado' ? (darkMode ? 'bg-gray-700 opacity-70' : 'bg-gray-200 opacity-70') : (darkMode ? 'bg-gray-700' : 'bg-white')} ${highContrast && darkMode ? 'border border-yellow-300' : ''} ${highContrast && !darkMode && apt.status !== 'Cancelado' ? 'border border-blue-500' : ''} ${highContrast && !darkMode && apt.status === 'Cancelado' ? 'border border-gray-400' : ''} `}> <h3 className={`text-lg font-semibold ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-blue-400') : (highContrast ? 'text-blue-700' : 'text-blue-600')}`}>{apt.doctor}</h3> {talkbackEnabled && <SpeakButton textToSpeak={`Appointment with ${apt.doctor}`} darkMode={darkMode} highContrast={highContrast}/>} <p><strong>Fecha:</strong> {apt.date} {talkbackEnabled && <SpeakButton textToSpeak={`Date ${apt.date}`} darkMode={darkMode} highContrast={highContrast}/>}</p> <p><strong>Hora:</strong> {apt.time} {talkbackEnabled && <SpeakButton textToSpeak={`Time ${apt.time}`} darkMode={darkMode} highContrast={highContrast}/>}</p> <p><strong>Razón:</strong> {apt.reason} {talkbackEnabled && <SpeakButton textToSpeak={`Reason ${apt.reason}`} darkMode={darkMode} highContrast={highContrast}/>}</p> <p><strong>Estado:</strong> <span className={`${apt.status === 'Cancelado' ? (darkMode ? 'text-red-400' : 'text-red-500') : (darkMode ? 'text-green-400' : 'text-green-500')}`}>{apt.status}</span> {talkbackEnabled && <SpeakButton textToSpeak={`Status ${apt.status}`} darkMode={darkMode} highContrast={highContrast}/>}</p> {apt.status !== 'Cancelado' && ( <button onClick={() => confirmCancel(apt.id)} className={`mt-3 font-semibold py-1 px-3 rounded-md text-sm flex items-center ${darkMode ? (highContrast ? 'bg-red-500 text-black hover:bg-red-600' : 'bg-red-600 hover:bg-red-700 text-white') : (highContrast ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-red-500 hover:bg-red-600 text-white')} `}> <Trash2 size={16} className="mr-1" /> Cancelar </button> )} </div> ))} </div> )} <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Book a New Appointment" darkMode={darkMode} highContrast={highContrast} fontSizeClass={accessibilitySettings.fontSize}> <form onSubmit={handleMakeAppointment} className="space-y-4"> {['doctor', 'date', 'time', 'reason'].map(field => ( <div key={field}> <label htmlFor={field} className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${highContrast && darkMode ? 'text-yellow-200':''}`}> {field.charAt(0).toUpperCase() + field.slice(1).replace('rV', 'r V')} </label> {field === 'doctor' ? ( <select id="doctor" value={doctor} onChange={(e) => setDoctor(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${highContrast ? (darkMode ? 'border-yellow-400' : 'border-blue-600') : ''}`}> {MOCK_DOCTORS.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)} </select> ) : field === 'reason' ? ( <textarea id="reason" rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Annual check-up" className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${highContrast ? (darkMode ? 'border-yellow-400' : 'border-blue-600') : ''}`}></textarea> ) : ( <input type={field === 'date' ? 'date' : 'time'} id={field} value={field === 'date' ? date : time} onChange={(e) => field === 'date' ? setDate(e.target.value) : setTime(e.target.value)} min={field === 'date' ? new Date().toISOString().split('T')[0] : undefined} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${highContrast ? (darkMode ? 'border-yellow-400' : 'border-blue-600') : ''}`} /> )} </div> ))} <button type="submit" className={`w-full font-semibold py-2 px-4 rounded-lg shadow-md flex items-center justify-center ${darkMode ? (highContrast ? 'bg-yellow-500 text-black hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700 text-white') : (highContrast ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600 text-white')}`}> Confirm Appointment </button> </form> </Modal> <Modal isOpen={confirmCancelModal.isOpen} onClose={() => setConfirmCancelModal({ isOpen: false, appointmentId: null })} title="Confirm Cancellation" darkMode={darkMode} highContrast={highContrast} fontSizeClass={accessibilitySettings.fontSize}> <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>Are you sure you want to cancel this appointment?</p> <div className="flex justify-end space-x-3"> <button onClick={() => setConfirmCancelModal({ isOpen: false, appointmentId: null })} className={`px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-black'}`}>No, Keep It</button> <button onClick={executeCancelAppointment} className={`px-4 py-2 rounded-md text-sm font-medium ${darkMode ? (highContrast ? 'bg-red-500 text-black hover:bg-red-600' : 'bg-red-600 hover:bg-red-700 text-white') : (highContrast ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-red-500 hover:bg-red-600 text-white')}`}>Yes, Cancel</button> </div> </Modal> </div> );
};

// ... other screen components (ChatScreen, PrescriptionsScreen, etc. remain similar) ...
const ChatScreen = ({ userId, showNotification, accessibilitySettings }) => {
  const [messages, setMessages] = useState([ { id: 'm1', text: '¡Hola! ¿Cómo puedo ayudarte hoy?', sender: 'doctor', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, { id: 'm2', text: 'Tengo fiebre y dolor de cabeza.', sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ]);
  const [newMessage, setNewMessage] = useState(''); const [selectedDoctor, setSelectedDoctor] = useState(MOCK_DOCTORS[0]?.id || ''); const messagesEndRef = useRef(null);
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const handleSendMessage = async (e) => {
    e.preventDefault(); if (!newMessage.trim()) return;
    // Mock sending message if no userId (not logged in)
    if (!userId) {
      showNotification("Por favor ingrese para recibir mensajes.", "error");
      setMessages(prev => [...prev, { id: `m${prev.length + 1}`, text: newMessage, sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setNewMessage('');
      return;
    }
    const messageData = { text: newMessage, sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), createdAt: new Date().toISOString(), userId: userId, doctorId: selectedDoctor };
    setMessages(prevMessages => [...prevMessages, { ...messageData, id: `m${prevMessages.length + 1}` }]); setNewMessage('');
    setTimeout(() => { setMessages(prev => [...prev, { id: `m${prev.length + 1}`, text: "Entiendo. ¿Puede decirme los síntomas?", sender: 'doctor', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]); }, 1500);
  };
  return ( <div className={`flex flex-col h-[calc(100vh-4rem)] transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} ${highContrast && darkMode ? 'border border-yellow-400' : ''} ${highContrast && !darkMode ? 'border border-blue-600' : ''}`}> <div className={`p-4 border-b shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${highContrast && darkMode ? 'border-b-yellow-400':''} ${highContrast && !darkMode ? 'border-b-blue-600':''}`}> <label htmlFor="doctorSelect" className={`text-sm font-medium mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${highContrast && darkMode ? 'text-yellow-200':''}`}>Chat with:</label> <select id="doctorSelect" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className={`p-2 border rounded-md focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${highContrast ? (darkMode ? 'border-yellow-400' : 'border-blue-600') : ''}`} > {MOCK_DOCTORS.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)} </select> </div> <div className="flex-grow p-4 space-y-4 overflow-y-auto"> {messages.map(msg => ( <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}> <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow ${msg.sender === 'user' ? (darkMode ? (highContrast ? 'bg-blue-700 text-white rounded-br-none border border-white' : 'bg-blue-600 text-white rounded-br-none') : (highContrast ? 'bg-blue-600 text-white rounded-br-none border border-black' : 'bg-blue-500 text-white rounded-br-none')) : (darkMode ? (highContrast ? 'bg-black text-yellow-300 rounded-bl-none border border-yellow-400' : 'bg-gray-700 text-gray-200 rounded-bl-none') : (highContrast ? 'bg-gray-300 text-black rounded-bl-none border border-black' : 'bg-gray-200 text-gray-800 rounded-bl-none')) } `}> <p>{msg.text} {talkbackEnabled && <SpeakButton textToSpeak={msg.text} darkMode={darkMode} highContrast={highContrast}/>}</p> <p className={`text-xs mt-1 ${msg.sender === 'user' ? (darkMode ? 'text-blue-200 text-right' : 'text-blue-100 text-right') : (darkMode ? 'text-gray-400 text-left' : 'text-gray-500 text-left')}`}> {msg.time} </p> </div> </div> ))} <div ref={messagesEndRef} /> </div> <form onSubmit={handleSendMessage} className={`p-4 border-t flex items-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${highContrast && darkMode ? 'border-t-yellow-400':''} ${highContrast && !darkMode ? 'border-t-blue-600':''}`}> <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className={`flex-grow p-3 border rounded-l-lg focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500' : 'border-gray-300 placeholder-gray-500 focus:ring-blue-400'} ${highContrast ? (darkMode ? 'border-yellow-400 focus:ring-yellow-300' : 'border-blue-600 focus:ring-blue-500') : ''}`} /> <button type="submit" className={`p-3 rounded-r-lg focus:outline-none focus:ring-2 ${darkMode ? (highContrast ? 'bg-yellow-500 text-black hover:bg-yellow-600 focus:ring-yellow-300' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500') : (highContrast ? 'bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-600' : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400')} `}> <Send size={24} /> </button> </form> </div> );
};

const PrescriptionsScreen = ({ userId, showNotification, accessibilitySettings }) => {
  const [prescriptions, setPrescriptions] = useState([]); const [isLoading, setIsLoading] = useState(true);
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;
  useEffect(() => { setIsLoading(true); if(userId) setPrescriptions(MOCK_PRESCRIPTIONS); else setPrescriptions([]); setIsLoading(false); }, [userId]);
  if (isLoading) { return <p className={`p-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading prescriptions...</p>; }
  if (!userId) { return <p className={`p-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>Please log in to view prescriptions.</p>; }
  return ( <div className={`p-4 min-h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} ${highContrast && darkMode ? 'border border-yellow-400' : ''} ${highContrast && !darkMode ? 'border border-blue-600' : ''}`}> <h2 className={`text-2xl font-semibold mb-6 ${highContrast && darkMode ? 'text-yellow-300' : highContrast ? 'text-blue-700' : ''}`}>Mis recetas</h2> {talkbackEnabled && <SpeakButton textToSpeak="Mis recetas page." darkMode={darkMode} highContrast={highContrast}/>} {prescriptions.length === 0 ? ( <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No tienes recetas prescritas.</p> ) : ( <div className="space-y-4"> {prescriptions.map(rx => ( <div key={rx.id} className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700 border-l-4 border-green-500' : 'bg-white border-l-4 border-green-500'} ${highContrast && darkMode ? 'border-yellow-300 border-l-yellow-400' : ''} ${highContrast && !darkMode ? 'border-blue-500 border-l-blue-700' : ''} `}> <h3 className={`text-lg font-semibold ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-green-400') : (highContrast ? 'text-blue-700' : 'text-green-700')}`}>{rx.name}</h3> {talkbackEnabled && <SpeakButton textToSpeak={`Prescription: ${rx.name}`} darkMode={darkMode} highContrast={highContrast}/>} <p><strong>Dosage:</strong> {rx.dosage} {talkbackEnabled && <SpeakButton textToSpeak={`Dosage ${rx.dosage}`} darkMode={darkMode} highContrast={highContrast}/>}</p> <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}><strong>Prescrito el:</strong> {rx.date} {talkbackEnabled && <SpeakButton textToSpeak={`Prescrito el ${rx.date}`} darkMode={darkMode} highContrast={highContrast}/>}</p> <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}><strong>Prescrito por:</strong> {rx.doctor} {talkbackEnabled && <SpeakButton textToSpeak={`Prescrito por ${rx.doctor}`} darkMode={darkMode} highContrast={highContrast}/>}</p> <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}><i>Anotaciones: {rx.notes}</i></p> </div> ))} </div> )} </div> );
};

const LabResultsScreen = ({ accessibilitySettings, userId }) => { // Added userId
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;
  if (!userId) { return <p className={`p-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>Please log in to view Resultados de laboratorio.</p>; }
  return (
    <div className={`p-4 min-h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} ${highContrast && darkMode ? 'border border-yellow-400' : ''} ${highContrast && !darkMode ? 'border border-blue-600' : ''}`}>
    <h2 className={`text-2xl font-semibold mb-6 ${highContrast && darkMode ? 'text-yellow-300' : highContrast ? 'text-blue-700' : ''}`}>Lab/Test Results</h2>
    {talkbackEnabled && <SpeakButton textToSpeak="Lab and Test Results page." darkMode={darkMode} highContrast={highContrast}/>}
    {MOCK_LAB_RESULTS.length === 0 ? (
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No Resultados de laboratorio found.</p>
    ) : (
      <div className="space-y-4">
      {MOCK_LAB_RESULTS.map(result => (
        <div key={result.id} className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'} ${highContrast && darkMode ? 'border border-yellow-300' : ''} ${highContrast && !darkMode ? 'border border-blue-500' : ''}`}>
        <div className="flex justify-between items-start">
        <h3 className={`text-lg font-semibold ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-blue-400') : (highContrast ? 'text-blue-700' : 'text-blue-600')}`}>{result.testName}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${result.status === 'Pending' ? (darkMode ? 'bg-yellow-600 text-black' : 'bg-yellow-200 text-yellow-800') : (darkMode ? 'bg-green-600 text-white' : 'bg-green-200 text-green-800')}`}>{result.status}</span>
        </div>
        {talkbackEnabled && <SpeakButton textToSpeak={`Test: ${result.testName}, Estado: ${result.status}`} darkMode={darkMode} highContrast={highContrast}/>}
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fecha: {result.date}</p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Doctor: {result.doctor}</p>
        <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{result.summary}</p>
        {result.status !== 'Pending' && (
          <button className={`mt-3 text-sm font-medium py-1 px-3 rounded ${darkMode ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-500 hover:bg-blue-600 text-white') : (highContrast ? 'bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')}`}>
          Ver Reporte Completo (PDF)
          </button>
        )}
        </div>
      ))}
      </div>
    )}
    </div>
  );
};

const MedicalHistoryScreen = ({ accessibilitySettings, userId }) => { // Added userId
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;
  const { diagnoses, allergies, immunizations } = MOCK_MEDICAL_HISTORY;
  if (!userId) { return <p className={`p-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>Please log in to view Historial médico.</p>; }

  const Section = ({ title, items, renderItem, speakTitle }) => (
    <div className="mb-6">
    <h3 className={`text-xl font-semibold mb-3 ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-gray-100') : (highContrast ? 'text-blue-700' : 'text-gray-800')}`}>{title}</h3>
    {talkbackEnabled && <SpeakButton textToSpeak={speakTitle || title} darkMode={darkMode} highContrast={highContrast}/>}
    {items.length > 0 ? (
      <ul className="space-y-2">
      {items.map(item => renderItem(item))}
      </ul>
    ) : <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No {title.toLowerCase()} recorded.</p>}
    </div>
  );

  return (
    <div className={`p-4 min-h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} ${highContrast && darkMode ? 'border border-yellow-400' : ''} ${highContrast && !darkMode ? 'border border-blue-600' : ''}`}>
    <h2 className={`text-2xl font-semibold mb-6 ${highContrast && darkMode ? 'text-yellow-300' : highContrast ? 'text-blue-700' : ''}`}>Historial médico</h2>
    {talkbackEnabled && <SpeakButton textToSpeak="Historial médico page." darkMode={darkMode} highContrast={highContrast}/>}

    <Section title="Diagnósticos" items={diagnoses} speakTitle="Diagnosed Conditions" renderItem={item => (
      <li key={item.id} className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'} ${highContrast && darkMode ? 'border border-yellow-300' : ''} ${highContrast && !darkMode ? 'border border-blue-500' : ''}`}>
      <p className="font-medium">{item.condition} {talkbackEnabled && <SpeakButton textToSpeak={`Condition: ${item.condition}`} darkMode={darkMode} highContrast={highContrast}/>}</p>
      <p className="text-sm">Fecha: {item.date}</p>
      <p className="text-sm">Anotaciones: {item.notes}</p>
      </li>
    )}/>
    <Section title="Alergias" items={allergies} speakTitle="Known Alergias" renderItem={item => (
      <li key={item.id} className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'} ${highContrast && darkMode ? 'border border-yellow-300' : ''} ${highContrast && !darkMode ? 'border border-blue-500' : ''}`}>
      <p className="font-medium">{item.substance} ({item.severity}) {talkbackEnabled && <SpeakButton textToSpeak={`Allergy: ${item.substance}, Severity: ${item.severity}`} darkMode={darkMode} highContrast={highContrast}/>}</p>
      <p className="text-sm">Reaction: {item.reaction}</p>
      </li>
    )}/>
    <Section title="Inmunizaciones" items={immunizations} speakTitle="Immunization Records" renderItem={item => (
      <li key={item.id} className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'} ${highContrast && darkMode ? 'border border-yellow-300' : ''} ${highContrast && !darkMode ? 'border border-blue-500' : ''}`}>
      <p className="font-medium">{item.vaccine} {talkbackEnabled && <SpeakButton textToSpeak={`Vaccine: ${item.vaccine}`} darkMode={darkMode} highContrast={highContrast}/>}</p>
      <p className="text-sm">Fecha: {item.date}</p>
      </li>
    )}/>
    </div>
  );
};

const EducationalResourcesScreen = ({ accessibilitySettings }) => {
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;
  const [searchTerm, setSearchTerm] = useState('');
  const filteredResources = MOCK_EDUCATIONAL_RESOURCES.filter(res =>
  res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  res.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
  res.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-4 min-h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} ${highContrast && darkMode ? 'border border-yellow-400' : ''} ${highContrast && !darkMode ? 'border border-blue-600' : ''}`}>
    <h2 className={`text-2xl font-semibold mb-4 ${highContrast && darkMode ? 'text-yellow-300' : highContrast ? 'text-blue-700' : ''}`}>Recursos informativos</h2>
    {talkbackEnabled && <SpeakButton textToSpeak="Recursos informativos page." darkMode={darkMode} highContrast={highContrast}/>}

    <div className="mb-6">
    <input
    type="text"
    placeholder="Busca artículos, videos, preguntas..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500' : 'border-gray-300 placeholder-gray-500 focus:ring-blue-400'} ${highContrast ? (darkMode ? 'border-yellow-400 focus:ring-yellow-300' : 'border-blue-600 focus:ring-blue-500') : ''}`}
    />
    </div>

    {filteredResources.length === 0 ? (
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No resources found matching your search.</p>
    ) : (
      <div className="space-y-4">
      {filteredResources.map(resource => (
        <div key={resource.id} className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'} ${highContrast && darkMode ? 'border border-yellow-300' : ''} ${highContrast && !darkMode ? 'border border-blue-500' : ''}`}>
        <span className={`text-xs px-2 py-0.5 rounded-full mb-1 inline-block ${darkMode ? 'bg-indigo-600 text-indigo-100' : 'bg-indigo-100 text-indigo-700'}`}>{resource.type}</span>
        <h3 className={`text-lg font-semibold ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-blue-400') : (highContrast ? 'text-blue-700' : 'text-blue-600')}`}>{resource.title}</h3>
        {talkbackEnabled && <SpeakButton textToSpeak={`${resource.type}: ${resource.title}`} darkMode={darkMode} highContrast={highContrast}/>}
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Categoría: {resource.category}</p>
        <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{resource.summary}</p>
        <button className={`mt-3 text-sm font-medium py-1 px-3 rounded ${darkMode ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-500 hover:bg-blue-600 text-white') : (highContrast ? 'bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')}`}>
        Ver más
        </button>
        </div>
      ))}
      </div>
    )}
    </div>
  );
};

const DoctorFinderScreen = ({ accessibilitySettings }) => {
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ specialty: '', insurance: '' });

  const filteredClinics = MOCK_CLINICS.filter(clinic =>
  (clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) || clinic.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
  (filters.specialty ? clinic.specialties.includes(filters.specialty) : true) &&
  (filters.insurance ? clinic.insurance.includes(filters.insurance) : true)
  );

  const allEspecialidades = [...new Set(MOCK_CLINICS.flatMap(c => c.specialties))];
  const allInsurances = [...new Set(MOCK_CLINICS.flatMap(c => c.insurance))];


  return (
    <div className={`p-4 min-h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} ${highContrast && darkMode ? 'border border-yellow-400' : ''} ${highContrast && !darkMode ? 'border border-blue-600' : ''}`}>
    <h2 className={`text-2xl font-semibold mb-4 ${highContrast && darkMode ? 'text-yellow-300' : highContrast ? 'text-blue-700' : ''}`}>Encuentra un hospital o clínica</h2>
    {talkbackEnabled && <SpeakButton textToSpeak="Encuentra un hospital o clínica" darkMode={darkMode} highContrast={highContrast}/>}

    <div className="mb-6 space-y-3">
    <input
    type="text"
    placeholder="Busca por nombre o dirección"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500' : 'border-gray-300 placeholder-gray-500 focus:ring-blue-400'} ${highContrast ? (darkMode ? 'border-yellow-400 focus:ring-yellow-300' : 'border-blue-600 focus:ring-blue-500') : ''}`}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <select value={filters.specialty} onChange={e => setFilters({...filters, specialty: e.target.value})} className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} ${highContrast ? (darkMode ? 'border-yellow-400' : 'border-blue-600') : ''}`}>
    <option value="">Todas las especialidades</option>
    {allEspecialidades.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
    <select value={filters.insurance} onChange={e => setFilters({...filters, insurance: e.target.value})} className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} ${highContrast ? (darkMode ? 'border-yellow-400' : 'border-blue-600') : ''}`}>
    <option value="">Todos los prestadores de salud</option>
    {allInsurances.map(i => <option key={i} value={i}>{i}</option>)}
    </select>
    </div>
    </div>

    {filteredClinics.length === 0 ? (
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No doctors or clinics found matching your criteria.</p>
    ) : (
      <div className="space-y-4">
      {filteredClinics.map(clinic => (
        <div key={clinic.id} className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'} ${highContrast && darkMode ? 'border border-yellow-300' : ''} ${highContrast && !darkMode ? 'border border-blue-500' : ''}`}>
        <h3 className={`text-lg font-semibold ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-blue-400') : (highContrast ? 'text-blue-700' : 'text-blue-600')}`}>{clinic.name}</h3>
        {talkbackEnabled && <SpeakButton textToSpeak={clinic.name} darkMode={darkMode} highContrast={highContrast}/>}
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}><MapPin size={14} className="inline mr-1"/>{clinic.address}</p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type: {clinic.type}</p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rating: {clinic.rating} / 5</p>
        <div className="mt-2">
        <h4 className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Especialidades:</h4>
        <div className="flex flex-wrap gap-1 mt-1">
        {clinic.specialties.map(s => <span key={s} className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-indigo-600 text-indigo-100' : 'bg-indigo-100 text-indigo-700'}`}>{s}</span>)}
        </div>
        </div>
        <button className={`mt-3 text-sm font-medium py-1 px-3 rounded ${darkMode ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-500 hover:bg-blue-600 text-white') : (highContrast ? 'bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')}`}>
        Ver Detalles
        </button>
        </div>
      ))}
      </div>
    )}
    </div>
  );
};

const MoreScreen = ({ setCurrentPage, accessibilitySettings, handleSignOut, openSettingsModal }) => {
  const { darkMode, highContrast, talkbackEnabled } = accessibilitySettings;

  const menuItems = [
    { label: 'Opciones de accesibilidad', action: openSettingsModal, icon: Settings, speak: "Opciones de accesibilidad" },
  ];

  return (
    <div className={`p-4 min-h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} ${highContrast && darkMode ? 'border border-yellow-400' : ''} ${highContrast && !darkMode ? 'border border-blue-600' : ''}`}>
    <h2 className={`text-2xl font-semibold mb-6 ${highContrast && darkMode ? 'text-yellow-300' : highContrast ? 'text-blue-700' : ''}`}>Más opciones</h2>
    {talkbackEnabled && <SpeakButton textToSpeak="More options page." darkMode={darkMode} highContrast={highContrast}/>}

    <div className="space-y-3">
    {menuItems.map(item => (
      <button
      key={item.label}
      onClick={() => item.page ? setCurrentPage(item.page) : item.action()}
      className={`w-full flex items-center p-4 rounded-lg shadow transition-colors
        ${darkMode ? (highContrast ? 'bg-black text-yellow-300 border border-yellow-400 hover:bg-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-white') : (highContrast ? 'bg-white text-blue-700 border border-blue-700 hover:bg-blue-50' : 'bg-white hover:bg-gray-50 text-gray-700')}
        `}
        aria-label={item.label}
        >
        <item.icon size={22} className={`mr-4 ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-blue-400') : (highContrast ? 'text-blue-600' : 'text-blue-500')}`} />
        <span className="flex-grow text-left font-medium">{item.label}</span>
        <ChevronRight size={20} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        {talkbackEnabled && <SpeakButton textToSpeak={item.speak || item.label} darkMode={darkMode} highContrast={highContrast} />}
        </button>
    ))}
    <button
    onClick={handleSignOut}
    className={`w-full flex items-center p-4 rounded-lg shadow transition-colors mt-6
      ${darkMode ? (highContrast ? 'bg-red-700 text-black border border-red-400 hover:bg-red-600' : 'bg-red-600 hover:bg-red-500 text-white') : (highContrast ? 'bg-red-100 text-red-700 border border-red-700 hover:bg-red-200' : 'bg-red-500 hover:bg-red-600 text-white')}
      `}
      aria-label="Cerrar Sesión"
      >
      <LogOut size={22} className="mr-4" />
      <span className="flex-grow text-left font-medium">Cerrar sesión</span>
      {talkbackEnabled && <SpeakButton textToSpeak="Sign Out" darkMode={darkMode} highContrast={highContrast} />}
      </button>
      </div>
      </div>
  );
};

// --- MODIFIED: AuthScreen Component ---
const AuthScreen = ({ onLogin, onRegister, showNotification, accessibilitySettings, setAuthView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // NEW: State for additional registration fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [secondLastName, setSecondLastName] = useState('');
  const [rut, setRut] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [cellphone, setCellphone] = useState('');

  const isLoginView = accessibilitySettings.currentAuthView === 'login';
  const { darkMode, highContrast } = accessibilitySettings;

  const toggleView = () => {
    setAuthView(prev => prev === 'login' ? 'register' : 'login');
  };

  // NEW: Age validation function
  const isAgeValid = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const dob = new Date(dateString);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 13;
  };

  // Verificación RUT
  var Fn = {
    // Valida el rut con su cadena completa "XXXXXXXX-X"
    validaRut : function (rut) {
      if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test( rut ))
        return false;
        var tmp 	= rut.split('-');
        var digv	= tmp[1];
        var rut 	= tmp[0];
        if ( digv == 'K' ) digv = 'k' ;
        return (Fn.dv(rut) == digv );
    },
    dv : function(T){
      var M=0,S=1;
      for(;T;T=Math.floor(T/10))
        S=(S+T%10*(9-M++%6))%11;
      return S?S-1:'k';
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification("Please enter email and password.", "error");
      return;
    }

    if (isLoginView) {
      onLogin(email, password);
    } else { // Registration view
      // NEW: Validations for registration fields
      if (!firstName || !lastName || !rut || !birthDate || !address || !cellphone) {
        showNotification("Por favor llene todos los campos solicitados.", "error");
        return;
      }
      if (!isAgeValid(birthDate)) {
        showNotification("Debes tener al menos 13 años para registrarte.", "error");
        return;
      }
      if (!Fn.validaRut(rut)) {
        showNotification("El rut ingresado es incorrecto", "error");
        return;
      }
      if (!/^\+?[0-9\s-()]+$/.test(cellphone)) { // Basic phone validation
        showNotification("Por favor ingrese un número de celular válido.", "error");
        return;
      }


      const profileData = {
        firstName, middleName, lastName, secondLastName,
        rut, // Store K as uppercase
        birthDate, address, cellphone, email // also store email in profile
      };
      onRegister(email, password, profileData);
    }
  };

  const inputBaseClass = `appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm`;
  const inputDarkClass = `bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500`;
  const inputLightClass = `border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  const inputHighContrastDark = `border-yellow-400 focus:ring-yellow-300`;
  const inputHighContrastLight = `border-blue-600 focus:ring-blue-500`;

  const getInputClass = () => `${inputBaseClass} ${darkMode ? inputDarkClass : inputLightClass} ${highContrast ? (darkMode ? inputHighContrastDark : inputHighContrastLight) : ''}`;


  const renderInputField = (id, type, value, setter, placeholder, IconComponent, label, required = false, pattern = undefined, title = undefined) => (
    <div>
    <label htmlFor={id} className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${highContrast && darkMode ? 'text-yellow-200' : ''}`}>
    {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <IconComponent size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
    </div>
    <input id={id} name={id} type={type} value={value} onChange={(e) => setter(e.target.value)}
    placeholder={placeholder} required={required} pattern={pattern} title={title}
    className={getInputClass()}
    />
    </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'} ${highContrast && darkMode ? 'border-2 border-yellow-400' : ''} ${highContrast && !darkMode ? 'border-2 border-blue-700' : ''}`}>
    <div className={`w-full max-w-md p-8 rounded-xl shadow-2xl ${darkMode ? (highContrast ? 'bg-black border border-yellow-400' : 'bg-gray-800') : (highContrast ? 'bg-white border-2 border-blue-600' : 'bg-white')}`}>
    <div className="flex justify-center mb-6">
    <ShieldCheck size={48} className={darkMode ? (highContrast ? "text-yellow-400" : "text-blue-500") : (highContrast ? "text-blue-600" : "text-blue-500")} />
    </div>
    <h2 className={`text-2xl font-bold text-center mb-6 ${darkMode ? (highContrast ? 'text-yellow-300' : 'text-white') : (highContrast ? 'text-blue-700' : 'text-gray-900')}`}>
    {isLoginView ? "Ingrese a MedCare Senior" : "Formulario de registro"}
    </h2>
    <form onSubmit={handleSubmit} className="space-y-4"> {/* Reduced space-y */}
    {renderInputField("email", "email", email, setEmail, "correo@ejemplo.cl", Mail, "Correo electrónico", true)}
    {renderInputField("password", "password", password, setPassword, "••••••••", KeyRound, "Contraseña", true)}

    {!isLoginView && (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderInputField("firstName", "text", firstName, setFirstName, "Nombre", User, "Nombre", true)}
      {renderInputField("middleName", "text", middleName, setMiddleName, "Opcional", User, "Segundo nombre")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderInputField("lastName", "text", lastName, setLastName, "Apellido", User, "Apellido paterno", true)}
      {renderInputField("secondLastName", "text", secondLastName, setSecondLastName, "Opcional", User, "Apellido materno")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderInputField("rut", "text", rut, setRut, "RUT", Hash, "RUT", true)}
      </div>
      {renderInputField("birthDate", "date", birthDate, setBirthDate, "", CalendarDays, "Fecha de nacimiento", true)}
      {renderInputField("address", "text", address, setAddress, "Dirección", MapPinned, "Dirección de residencia", true)}
      {renderInputField("cellphone", "tel", cellphone, setCellphone, "+56912345678", Phone, "Teléfono celular", true)}
      </>
    )}
    <div>
    <button
    type="submit"
    className={`w-full flex justify-center mt-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
      ${darkMode ? (highContrast ? 'bg-yellow-500 hover:bg-yellow-600 text-black focus:ring-yellow-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500') : (highContrast ? 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-600' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500')}
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${darkMode && highContrast ? 'focus:ring-offset-black' : darkMode ? 'focus:ring-offset-gray-800' : highContrast ? 'focus:ring-offset-white' : 'focus:ring-offset-gray-100' }`}
      >
      {isLoginView ? "Ingresar" : "Crear cuenta"}
      </button>
      </div>
      </form>
      <div className="mt-6 text-center">
      <button
      onClick={toggleView}
      className={`text-sm font-medium
        ${darkMode ? (highContrast ? 'text-yellow-300 hover:text-yellow-200' : 'text-blue-400 hover:text-blue-300') : (highContrast ? 'text-blue-600 hover:text-blue-500' : 'text-blue-600 hover:text-blue-500')}`}
        >
        {isLoginView ? "¿No se encuentra registrado?\nRegístrese" : "¿Ya tiene una cuenta?\nIngrese"}
        </button>
        </div>
        </div>
        </div>
  );
};


// --- Main App Component ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userName, setUserName] = useState(''); // This will now store the full name
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [authView, setAuthView] = useState('login');

  const [accessibilitySettings, setAccessibilitySettings] = useState({
    fontSize: 'text-base', highContrast: false, darkMode: false, talkbackEnabled: false,
    currentAuthView: 'login'
  });
  useEffect(() => {
    setAccessibilitySettings(prev => ({ ...prev, currentAuthView: authView }));
  }, [authView]);

  useEffect(() => { const savedSettings = localStorage.getItem('medicAssistAccessibilitySettings'); if (savedSettings) { setAccessibilitySettings(prev => ({...prev, ...JSON.parse(savedSettings)})); } }, []);

  useEffect(() => {
    const { currentAuthView, ...settingsToSave } = accessibilitySettings;
    localStorage.setItem('medicAssistAccessibilitySettings', JSON.stringify(settingsToSave));
    if (accessibilitySettings.darkMode) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.remove('dark'); }
  }, [accessibilitySettings]);

  const updateAccessibilitySetting = (key, value) => { setAccessibilitySettings(prev => ({ ...prev, [key]: value })); };
  const showNotification = useCallback((message, type = 'info', duration = 3000) => { setNotification({ message, type }); setTimeout(() => setNotification({ message: '', type: '' }), duration); }, []);

  // MODIFIED: onAuthStateChanged listener
  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth is not initialized.");
      setIsAuthReady(true);
      setAuthView('login');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => { // Made async
      if (user) {
        setCurrentUser(user);
        // Fetch full user profile from Firestore
        if (db) {
          const userDocRef = doc(db, "users", user.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              // Construct full name
              const fullName = [userData.firstName, userData.middleName, userData.lastName, userData.secondLastName]
              .filter(Boolean) // Remove empty/null parts
              .join(" ");
              setUserName(fullName || user.email || `User-${user.uid.substring(0,5)}`);
            } else {
              // If no Firestore doc, use displayName from auth (set during registration) or email
              setUserName(user.displayName || user.email || `User-${user.uid.substring(0,5)}`);
            }
          } catch (error) {
            console.error("Error fetching user data from Firestore:", error);
            setUserName(user.displayName || user.email || `User-${user.uid.substring(0,5)}`); // Fallback
          }
        } else { // Fallback if db is not available
          setUserName(user.displayName || user.email || `User-${user.uid.substring(0,5)}`);
        }

        setAuthView('app');
        setCurrentPage('home');
      } else {
        setCurrentUser(null);
        setUserName('');
        setAuthView('login');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [showNotification]); // db is also a dependency if used directly here, but it's from import.

  // MODIFIED: handleRegister to accept profileData
  const handleRegister = async (email, password, profileData) => {
    if (!auth) { showNotification("Authentication service not available.", "error"); return; }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Construct full name for displayName
      const displayName = [profileData.firstName, profileData.lastName].filter(Boolean).join(" ");

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: displayName });

      // Store additional profile data in Firestore
      if (db) {
        await setDoc(doc(db, "users", user.uid), {
          ...profileData, // Includes all fields from form
          createdAt: new Date().toISOString() // Add a creation timestamp
        });
      }

      showNotification("Resgistro exitoso!", "success");
      // onAuthStateChanged will handle setting the user, full name, and view
    } catch (error) {
      console.error("Error en el registro:", error);
      const errorCode = error.code;
      let friendlyMessage = "Registro fallido. Por favor intente nuevamente.";
      if (errorCode === 'auth/email-already-in-use') {
        friendlyMessage = 'Este correo ya se encuentra registrado. Ingrese o intente con otro correo.';
      } else if (errorCode === 'auth/weak-password') {
        friendlyMessage = 'La contraseña debe contener al menos 6 caracteres.';
      } else if (error.message) {
        friendlyMessage = error.message;
      }
      showNotification(friendlyMessage, "error");
    }
  };

  const handleLogin = async (email, password) => {
    if (!auth) { showNotification("Servicio de autenticación no disponible.", "error"); return; }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showNotification("¡Ingreso exitoso!", "success");
      // onAuthStateChanged will handle setting the user, full name, and view
    } catch (error) {
      console.error("Error during login:", error);
      const errorCode = error.code;
      let friendlyMessage = "Ingreso fallido. Revise sus credenciales.";
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        friendlyMessage = 'Correo o contraseña incorrectos. Por favor intente nuevamente.';
      } else if (error.message) {
        friendlyMessage = error.message;
      }
      showNotification(friendlyMessage, "error");
    }
  };

  const handleSignOut = async () => {
    if (!auth) { showNotification("Servicio de autenticación no disponible.", "error"); return; }
    try { await signOut(auth); setCurrentPage('home'); showNotification("Cierre de sesión exitoso.", "success");
    }
    catch (error) { console.error("Error cerrando sesión:", error); showNotification("Error cerrando sesión.", "error"); }
  };

  const renderPage = () => {
    const userId = currentUser ? currentUser.uid : null;
    if (!userId && authView === 'app') { // Should not happen if logic is correct, but as a safe guard
      setAuthView('login');
      return null;
    }
    const commonProps = { userId, showNotification, accessibilitySettings, setCurrentPage };

    switch (currentPage) {
      case 'home': return <HomeScreen userName={userName} {...commonProps} />; // userName is now the full name
      case 'myAppointments': return <AppointmentsScreen {...commonProps} />;
      case 'chat': return <ChatScreen {...commonProps} />;
      case 'prescriptions': return <PrescriptionsScreen {...commonProps} />;
      case 'labResults': return <LabResultsScreen {...commonProps} userId={userId} />;
      case 'medicalHistory': return <MedicalHistoryScreen {...commonProps} userId={userId} />;
      case 'educationalResources': return <EducationalResourcesScreen {...commonProps} />;
      case 'doctorFinder': return <DoctorFinderScreen {...commonProps} />;
      case 'more': return <MoreScreen handleSignOut={handleSignOut} openSettingsModal={() => setIsSettingsModalOpen(true)} {...commonProps} />;
      default: return <HomeScreen userName={userName} {...commonProps} />;
    }
  };

  const NavItem = ({ page, label, icon: IconComponent }) => (
    <button onClick={() => setCurrentPage(page)} className={`flex flex-col items-center justify-center p-2 w-full transition-colors duration-200 ease-in-out ${accessibilitySettings.fontSize} ${currentPage === page ? (accessibilitySettings.darkMode ? (accessibilitySettings.highContrast ? 'text-yellow-300' : 'text-blue-400') : (accessibilitySettings.highContrast ? 'text-blue-700 font-bold' : 'text-blue-500')) : (accessibilitySettings.darkMode ? (accessibilitySettings.highContrast ? 'text-gray-400 hover:text-yellow-200' : 'text-gray-400 hover:text-blue-300') : (accessibilitySettings.highContrast ? 'text-gray-600 hover:text-blue-600' : 'text-gray-500 hover:text-blue-400')) } `} >
    <IconComponent size={24} strokeWidth={currentPage === page ? 2.5 : 2} /> <span className="text-xs mt-1">{label}</span>
    </button>
  );

  let appClasses = `font-sans antialiased flex flex-col min-h-screen transition-colors duration-300 ${accessibilitySettings.fontSize}`;
  if (accessibilitySettings.darkMode) { appClasses += accessibilitySettings.highContrast ? ' bg-black text-yellow-300' : ' bg-gray-900 text-gray-200'; }
  else { appClasses += accessibilitySettings.highContrast ? ' bg-white text-black border-2 border-blue-900' : ' bg-gray-100 text-gray-800'; }

  if (!isAuthReady) {
    return (
      <div className={`flex justify-center items-center h-screen ${accessibilitySettings.fontSize} ${accessibilitySettings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <p>Initializing App...</p>
      </div>
    );
  }

  if (!currentUser) { // Or check authView !== 'app'
    return (
      <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({message: '', type: ''})} darkMode={accessibilitySettings.darkMode} />
      <AuthScreen
      onLogin={handleLogin}
      onRegister={handleRegister}
      showNotification={showNotification}
      accessibilitySettings={accessibilitySettings}
      setAuthView={setAuthView}
      />
      </>
    );
  }

  return (
    <div className={appClasses}>
    <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({message: '', type: ''})} darkMode={accessibilitySettings.darkMode} />
    <header className={`p-4 shadow-md flex justify-between items-center sticky top-0 z-40 ${accessibilitySettings.darkMode ? (accessibilitySettings.highContrast ? 'bg-black text-yellow-300 border-b-2 border-yellow-400' : 'bg-gray-800 text-white') : (accessibilitySettings.highContrast ? 'bg-white text-blue-700 border-b-2 border-blue-700' : 'bg-blue-600 text-white')} `}>
    <h1 className="text-xl font-semibold">MedCare Senior</h1>
    <div className="flex items-center space-x-2">
    {currentUser && <span className="text-sm hidden sm:inline">{userName}</span>} {/* userName is now full name */}
    <button onClick={() => setIsSettingsModalOpen(true)} aria-label="Open accessibility settings" className={`p-2 rounded-md ${accessibilitySettings.darkMode ? (accessibilitySettings.highContrast ? 'hover:bg-yellow-700 text-yellow-300' : 'hover:bg-gray-700 text-gray-300') : (accessibilitySettings.highContrast ? 'hover:bg-blue-200 text-blue-700' : 'hover:bg-blue-700 text-blue-100')} `}>
    <Settings size={22} />
    </button>
    </div>
    </header>
    <main className="flex-grow overflow-y-auto"> {renderPage()} </main>
    <nav className={`fixed bottom-0 left-0 right-0 border-t shadow-t-md flex justify-around items-center h-16 z-40 ${accessibilitySettings.darkMode ? (accessibilitySettings.highContrast ? 'bg-black border-t-yellow-400' : 'bg-gray-800 border-gray-700') : (accessibilitySettings.highContrast ? 'bg-white border-t-blue-700' : 'bg-white border-gray-200')} `}>
    <NavItem page="home" label="Inicio" icon={Home} />
    <NavItem page="myAppointments" label="Citas" icon={CalendarPlus} />
    <NavItem page="chat" label="Chat" icon={MessageSquare} />
    <NavItem page="more" label="Más" icon={Menu} />
    </nav>
    <div className="h-16"></div>
    <AccessibilitySettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={accessibilitySettings} updateSettings={updateAccessibilitySetting} darkMode={accessibilitySettings.darkMode} highContrast={accessibilitySettings.highContrast} fontSizeClass={accessibilitySettings.fontSize} />
    </div>
  );
};

export default App;
