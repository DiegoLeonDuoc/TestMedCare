import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'firebase/auth';
import { collection, addDoc, doc, updateDoc as updateFirestoreDoc, onSnapshot, query, setDoc, getDoc } from 'firebase/firestore';
import { Home, CalendarPlus, MessageSquare, ListChecks, UserCircle, XCircle, Send, PlusCircle, Trash2, LogOut, CheckCircle, AlertTriangle, Info, Settings, Volume2, Eye, Moon, Sun, ZoomIn, ZoomOut, FileText, Activity, BookOpen, Search, MapPin, Menu, ChevronRight, ShieldCheck, FileBarChart2, Stethoscope, School, Mail, KeyRound, User, Hash, CalendarDays, MapPinned, Phone } from 'lucide-react';

import { auth, db, customAppId } from './firebaseConfig.js';
import {
  MOCK_PRESCRIPTIONS, MOCK_DOCTORS, MOCK_LAB_RESULTS, MOCK_MEDICAL_HISTORY, MOCK_EDUCATIONAL_RESOURCES, MOCK_CLINICS
} from './mockData.js';

// Theme Context for managing theme state globally
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('text-base');
  const [talkbackEnabled, setTalkbackEnabled] = useState(false);

  // Detect system preference and load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedFontSize = localStorage.getItem('fontSize') || 'text-base';
    const savedTalkback = localStorage.getItem('talkbackEnabled') === 'true';

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    setHighContrast(savedHighContrast);
    setFontSize(savedFontSize);
    setTalkbackEnabled(savedTalkback);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    root.className = fontSize;

    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('highContrast', highContrast.toString());
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('talkbackEnabled', talkbackEnabled.toString());
  }, [theme, highContrast, fontSize, talkbackEnabled]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const updateFontSize = (newSize) => {
    setFontSize(newSize);
  };

  const toggleTalkback = () => {
    setTalkbackEnabled(prev => !prev);
  };

  const value = {
    theme,
    highContrast,
    fontSize,
    talkbackEnabled,
    isDark: theme === 'dark',
    toggleTheme,
    toggleHighContrast,
    updateFontSize,
    toggleTalkback,
    // Legacy compatibility
    darkMode: theme === 'dark',
    fontSizeClass: fontSize
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Enhanced Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  const { fontSize } = useTheme();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`theme-modal p-6 w-full max-w-md ${fontSize}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold theme-text-primary">{title}</h3>
          <button 
            onClick={onClose} 
            className="theme-text-secondary hover:theme-text-primary transition-colors theme-focus-visible"
            aria-label="Close modal"
          >
            <XCircle size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// Enhanced Notification Component
const Notification = ({ message, type, onDismiss }) => {
  if (!message) return null;
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  const bgClass = type === 'success' ? 'theme-bg-success' : type === 'error' ? 'theme-bg-error' : 'theme-bg-accent';
  
  return (
    <div className={`fixed top-4 right-4 ${bgClass} theme-text-inverse p-4 rounded-lg theme-shadow-md flex items-center z-[100]`}>
      <Icon size={24} className="mr-3" />
      <span>{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="ml-4 theme-text-inverse hover:opacity-80 transition-opacity"
          aria-label="Dismiss notification"
        >
          <XCircle size={20} />
        </button>
      )}
    </div>
  );
};

// Enhanced SpeakButton Component
const SpeakButton = ({ textToSpeak }) => {
  const { talkbackEnabled } = useTheme();
  
  if (!talkbackEnabled) return null;
  
  const handleSpeak = (e) => {
    e.stopPropagation();
    if ('speechSynthesis' in window && textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported or no text to speak.");
    }
  };
  
  return (
    <button 
      onClick={handleSpeak} 
      aria-label={`Speak: ${textToSpeak.substring(0,30)}...`} 
      title="Read aloud" 
      className="ml-2 p-1 rounded theme-bg-secondary theme-text-primary hover:theme-bg-tertiary transition-colors theme-focus-visible"
    >
      <Volume2 size={16} />
    </button>
  );
};

// Enhanced AccessibilitySettingsModal Component
const AccessibilitySettingsModal = ({ isOpen, onClose }) => {
  const { 
    theme, 
    highContrast, 
    fontSize, 
    talkbackEnabled, 
    toggleTheme, 
    toggleHighContrast, 
    updateFontSize, 
    toggleTalkback 
  } = useTheme();
  
  const fontSizes = [
    { label: 'Normal', value: 'text-base' },
    { label: 'Grande', value: 'text-lg' },
    { label: 'Extra Grande', value: 'text-xl' },
  ];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Opciones de accesibilidad">
      <div className="space-y-6">
        {/* Font Size Section */}
        <div>
          <h4 className="font-semibold mb-2 theme-text-secondary">Tamaño de letra</h4>
          <div className="flex space-x-2">
            {fontSizes.map(fs => (
              <button
                key={fs.value}
                onClick={() => updateFontSize(fs.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors theme-focus-visible ${
                  fontSize === fs.value 
                    ? 'theme-bg-accent theme-text-inverse' 
                    : 'theme-bg-secondary theme-text-primary hover:theme-bg-tertiary'
                }`}
              >
                {fs.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Theme Section */}
        <div>
          <h4 className="font-semibold mb-2 theme-text-secondary">Tema</h4>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors theme-button-secondary theme-focus-visible"
          >
            {theme === 'dark' ? <Sun size={18} className="mr-2" /> : <Moon size={18} className="mr-2" />}
            {theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          </button>
        </div>
        
        {/* High Contrast Section */}
        <div>
          <h4 className="font-semibold mb-2 theme-text-secondary">Contraste</h4>
          <button
            onClick={toggleHighContrast}
            className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors theme-focus-visible ${
              highContrast 
                ? 'theme-bg-accent theme-text-inverse' 
                : 'theme-button-secondary'
            }`}
          >
            <Eye size={18} className="mr-2" />
            {highContrast ? 'Deshabilitar Alto Contraste' : 'Habilitar Alto Contraste'}
          </button>
        </div>
        
        {/* TalkBack Section */}
        <div>
          <h4 className="font-semibold mb-2 theme-text-secondary">Leer en voz alta (Simulación de TalkBack)</h4>
          <button
            onClick={toggleTalkback}
            className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors theme-focus-visible ${
              talkbackEnabled 
                ? 'theme-bg-success theme-text-inverse' 
                : 'theme-button-secondary'
            }`}
          >
            <Volume2 size={18} className="mr-2" />
            {talkbackEnabled ? 'Deshabilitar Leer en Voz Alta' : 'Habilitar Leer en Voz Alta'}
          </button>
          {talkbackEnabled && (
            <p className="mt-2 text-xs theme-text-tertiary">
              When enabled, look for <Volume2 size={12} className="inline" /> icons to have text read aloud.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Enhanced HomeScreen Component
const HomeScreen = ({ setCurrentPage, userName, userId }) => {
  const welcomeMessage = `Bienvenido, ${userName || 'User'}!`;
  
  const quickLinks = [
    { page: 'myAppointments', label: 'Mis citas', icon: CalendarPlus, speak: "Mis citas." },
    { page: 'chat', label: 'Habla con un doctor', icon: MessageSquare, speak: "Habla con un doctor." },
    { page: 'prescriptions', label: 'Mis recetas', icon: FileText, speak: "Mis recetas." },
    { page: 'labResults', label: 'Resultados de laboratorio', icon: FileBarChart2, speak: "Resultados de laboratorio." },
    { page: 'medicalHistory', label: 'Historial médico', icon: Activity, speak: "Historial médico." },
    { page: 'doctorFinder', label: 'Busca un doctor', icon: Stethoscope, speak: "Busca un doctor." },
    { page: 'educationalResources', label: 'Recursos informativos', icon: School, speak: "Recursos informativos." }
  ];

  return (
    <div className="p-6 min-h-[calc(100vh-4rem)] flex flex-col items-center theme-gradient-primary theme-text-inverse">
      <UserCircle size={60} className="mb-3 theme-text-accent" />
      <div className="flex items-center">
        <h1 className="text-2xl font-bold mb-1">{welcomeMessage}</h1>
        <SpeakButton textToSpeak={welcomeMessage} />
      </div>

      <div className="flex items-center mb-5">
        <p className="text-center text-sm opacity-90">¿Cómo podemos ayudarte hoy?</p>
        <SpeakButton textToSpeak="¿Cómo podemos ayudarte hoy?" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {quickLinks.map(item => (
          <button
            key={item.page}
            onClick={() => setCurrentPage(item.page)}
            className="p-4 rounded-lg theme-shadow-md transition-all flex flex-col items-center justify-center aspect-square theme-bg-primary theme-text-primary hover:theme-bg-secondary theme-focus-visible"
            aria-label={item.label}
          >
            <item.icon size={28} className="mb-1.5 theme-text-accent" />
            <span className="font-semibold text-center text-sm">{item.label}</span>
            <SpeakButton textToSpeak={item.speak || item.label} />
          </button>
        ))}
      </div>
    </div>
  );
};

// Placeholder for other screen components (keeping structure similar but with theme classes)
const AppointmentsScreen = ({ userId, showNotification }) => {
  // Implementation would use theme classes instead of conditional styling
  return (
    <div className="p-4 min-h-[calc(100vh-4rem)] theme-bg-secondary theme-text-primary">
      <h2 className="text-2xl font-semibold theme-text-primary mb-6">Mis citas</h2>
      {/* Rest of component implementation with theme classes */}
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);

  // Authentication state management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Load user profile data
        try {
          const userDocRef = doc(db, `artifacts/${customAppId}/users`, user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.displayName || user.displayName || user.email?.split('@')[0] || 'User');
          } else {
            setUserName(user.displayName || user.email?.split('@')[0] || 'User');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        }
      } else {
        setUser(null);
        setUserName('');
        setCurrentPage('home');
      }
    });

    return () => unsubscribe();
  }, []);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('Logged out successfully', 'success');
      setCurrentPage('home');
    } catch (error) {
      console.error('Error signing out:', error);
      showNotification('Error signing out', 'error');
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomeScreen setCurrentPage={setCurrentPage} userName={userName} userId={user?.uid} />;
      case 'myAppointments':
        return <AppointmentsScreen userId={user?.uid} showNotification={showNotification} />;
      // Add other cases for different screens
      default:
        return <HomeScreen setCurrentPage={setCurrentPage} userName={userName} userId={user?.uid} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen theme-bg-primary theme-text-primary">
        {/* Header */}
        <header className="theme-bg-secondary theme-border-primary border-b px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold theme-text-accent">MediApp</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAccessibilityModalOpen(true)}
              className="p-2 rounded-lg theme-bg-tertiary theme-text-primary hover:theme-bg-accent hover:theme-text-inverse transition-colors theme-focus-visible"
              aria-label="Accessibility settings"
            >
              <Settings size={20} />
            </button>
            
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg theme-bg-tertiary theme-text-primary hover:theme-bg-error hover:theme-text-inverse transition-colors theme-focus-visible"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main>
          {renderCurrentPage()}
        </main>

        {/* Modals and Notifications */}
        <AccessibilitySettingsModal
          isOpen={isAccessibilityModalOpen}
          onClose={() => setIsAccessibilityModalOpen(false)}
        />
        
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification({ message: '', type: '' })}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;

