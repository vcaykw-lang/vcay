import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState, ReactNode } from 'react';
import { Menu, X, Phone, Mail, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import './lib/i18n';
import { auth, db, signOut, OperationType, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Pages (to be created)
import Home from './pages/Home';
import Book from './pages/Book';
import Contact from './pages/Contact';
import Contract from './pages/Contract';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Success from './pages/Success';

const Layout = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'user');
          } else {
            // New user, check if they should be admin (bootstrapped admin)
            // Note: your previous email was kddmilkchoco@gmail.com
            // We can check if it matches a specific phone number or keep the logic flexible
            const role = (user.email === 'kddmilkchoco@gmail.com' || user.email === 'vcaykw@gmail.com') ? 'admin' : 'user';
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email || '',
              phoneNumber: user.phoneNumber || '',
              role: role,
              createdAt: new Date().toISOString()
            });
            setUserRole(role);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: t('book'), path: '/book' },
    { name: t('contact'), path: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="text-2xl font-black tracking-tighter text-brand-brown">VCAY</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-bold transition-colors hover:text-brand-brown ${
                    location.pathname === link.path ? 'text-brand-brown' : 'text-gray-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <button
              onClick={toggleLanguage}
              className="px-4 py-1.5 text-xs font-black border-2 border-brand-pink/30 rounded-xl hover:bg-brand-soft transition-colors text-brand-brown"
            >
              {i18n.language === 'en' ? 'عربي' : 'EN'}
            </button>
            <Link
              to={isAuthenticated ? (userRole === 'admin' ? '/admin' : '/dashboard') : '/login'}
              className="px-5 py-2.5 bg-brand-brown text-white rounded-2xl text-sm font-bold hover:bg-[#523f36] transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {isAuthenticated ? t('dashboard') : t('login')}
            </Link>
            {isAuthenticated && (
              <button
                onClick={async () => {
                  await signOut(auth);
                  window.location.href = '/';
                }}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-brand-brown transition-colors"
                id="header-logout-btn"
              >
                {t('logout') || 'Logout'}
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse md:hidden">
            <button
              onClick={toggleLanguage}
              className="text-[10px] font-black border-2 border-brand-pink/20 px-2.5 py-1.5 rounded-lg text-brand-brown"
            >
              {i18n.language === 'en' ? 'AR' : 'EN'}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 bg-brand-soft text-brand-brown rounded-xl border border-brand-pink/20"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 md:hidden overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="block text-lg font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-gray-100 flex flex-col space-y-4">
                  <Link
                    to={isAuthenticated ? (userRole === 'admin' ? '/admin' : '/dashboard') : '/login'}
                    className="w-full py-3 bg-brand-brown text-white text-center rounded-xl font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {isAuthenticated ? t('dashboard') : t('login')}
                  </Link>
                  {isAuthenticated && (
                    <button
                      onClick={async () => {
                        await signOut(auth);
                        window.location.href = '/';
                      }}
                      className="w-full py-3 bg-gray-100 text-gray-600 text-center rounded-xl font-medium"
                    >
                      {t('logout') || 'Logout'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-brand-soft border-t border-brand-pink/30 py-12 px-4 text-brand-brown">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-brand-brown">VCAY</h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Experience the finest chalet in Kuwait. Luxury, comfort, and memories that last a lifetime.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">{t('contact')}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <a href="mailto:vcaykw@gmail.com" className="flex items-center space-x-2 rtl:space-x-reverse hover:text-brand-brown transition-colors">
                <Mail size={16} />
                <span>vcaykw@gmail.com</span>
              </a>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Phone size={16} />
                <span>96729996</span>
              </div>
              <a 
                href="https://maps.app.goo.gl/EnNfFbwSAWRqzfY3A" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center space-x-2 rtl:space-x-reverse hover:text-brand-brown transition-colors"
              >
                <MapPin size={16} />
                <span>28.679295, 48.339688</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div className="flex space-x-4 rtl:space-x-reverse">
              {/* Social icons if needed */}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {t('footer_copy')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contract" element={<Contract />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
