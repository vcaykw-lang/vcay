import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Calendar, User, Package, Clock, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, signOut, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

interface Booking {
  id: string;
  status: string;
  date: string;
  nights: number;
  total: number;
}

const UserDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);

      // Real-time user bookings
      const q = query(
        collection(db, 'bookings'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubBookings = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      });

      return () => unsubBookings();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-soft border border-brand-pink/20 rounded-2xl flex items-center justify-center text-brand-brown">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hello, {user.displayName || user.email}</h1>
            <p className="text-gray-500 text-sm">Welcome back to your dashboard</p>
          </div>
        </div>
        <button 
          onClick={async () => { await signOut(auth); navigate('/'); }}
          className="px-4 py-2 text-sm font-bold text-gray-500 border border-gray-100 rounded-xl hover:bg-gray-50 hover:text-brand-brown transition-all flex items-center gap-2"
        >
          <LogOut size={16} />
          {t('logout')}
        </button>
      </header>

      <section className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package size={24} className="text-brand-brown" />
          <span>{t('history')}</span>
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">No bookings yet.</p>
              <button 
                onClick={() => navigate('/book')}
                className="mt-4 text-brand-brown font-bold hover:underline"
              >
                Book your first stay
              </button>
            </div>
          ) : bookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-pink/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{booking.id}</span>
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                      booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 italic">{booking.date} • {booking.nights} nights</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:text-right gap-4">
                <div>
                   <p className="text-xs text-gray-400 uppercase font-bold">{t('total_price')}</p>
                   <p className="text-xl font-black text-brand-brown">{booking.total} {t('kwd')}</p>
                </div>
                <button className="p-2 bg-brand-soft text-brand-brown border border-brand-pink/20 rounded-lg hover:bg-brand-brown hover:text-white transition-colors">
                  <Clock size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-brand-soft p-8 rounded-3xl space-y-4 border border-brand-pink/20">
        <h3 className="font-bold">Need help?</h3>
        <p className="text-sm text-gray-700">If you have any questions regarding your bookings, please contact our support team at vcaykw@gmail.com.</p>
        <button 
          onClick={() => navigate('/contact')}
          className="px-6 py-3 bg-brand-brown text-white rounded-xl font-bold shadow-md hover:bg-[#523f36] transition-colors"
        >
          {t('contact')}
        </button>
      </section>
    </div>
  );
};

export default UserDashboard;
