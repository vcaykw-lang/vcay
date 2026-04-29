import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, Calendar, Banknote, 
  Search, Download, Trash2, Edit3, ChevronLeft, ChevronRight, Save, LogOut 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameMonth, 
  startOfWeek, endOfWeek, parseISO 
} from 'date-fns';
import { auth, db, handleFirestoreError, OperationType, signOut } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';

interface Booking {
  id: string;
  customer: string;
  phone: string;
  date: string;
  nights: number;
  total: number;
  status: string;
  userPhone?: string;
}

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Pricing Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [standardPrices, setStandardPrices] = useState<Record<number, number>>({
    0: 150, 1: 150, 2: 150, 3: 150, 4: 200, 5: 200, 6: 200
  });

  // Bulk Update State
  const [bulkDay, setBulkDay] = useState<number>(5); // Default Friday
  const [bulkPrice, setBulkPrice] = useState<string>('200');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        navigate('/');
        return;
      }
      setIsAdmin(true);
    });

    // Real-time bookings
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubBookings = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    // Real-time prices
    const unsubPrices = onSnapshot(doc(db, 'settings', 'prices'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.standardPrices) setStandardPrices(data.standardPrices);
        if (data.customPrices) setCustomPrices(data.customPrices);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/prices');
    });

    return () => {
      unsubscribeAuth();
      unsubBookings();
      unsubPrices();
    };
  }, [navigate]);

  const saveStandardPrices = async () => {
    try {
      await setDoc(doc(db, 'settings', 'prices'), {
        standardPrices,
        customPrices,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('Standard prices saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/prices');
    }
  };

  const handleBulkUpdate = async () => {
    const newCustom = { ...customPrices };
    const daysInMonth = calendarDays();
    
    daysInMonth.forEach(day => {
      if (isSameMonth(day, currentMonth) && day.getDay() === bulkDay) {
        const dateStr = format(day, 'yyyy-MM-dd');
        newCustom[dateStr] = Number(bulkPrice);
      }
    });

    try {
      await setDoc(doc(db, 'settings', 'prices'), {
        customPrices: newCustom,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert(`Applied ${bulkPrice} KWD to all ${['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays'][bulkDay]} in ${format(currentMonth, 'MMMM')}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/prices');
    }
  };

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    setEditingDay(dateStr);
    setEditPrice(customPrices[dateStr]?.toString() || '');
  };

  const handleSavePrice = async () => {
    if (editingDay) {
      const newPrices = { ...customPrices };
      if (editPrice === '' || isNaN(Number(editPrice))) {
        delete newPrices[editingDay];
      } else {
        newPrices[editingDay] = Number(editPrice);
      }
      
      try {
        await setDoc(doc(db, 'settings', 'prices'), {
          customPrices: newPrices,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setEditingDay(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'settings/prices');
      }
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bookings/${id}`);
    }
  };

  const stats = [
    { 
      label: 'Total Bookings', 
      value: bookings.length.toString(), 
      icon: Calendar, 
      color: 'text-brand-brown', 
      bg: 'bg-brand-soft' 
    },
    { 
      label: 'Total Revenue', 
      value: `${bookings.reduce((acc, b) => acc + (Number(b.total) || 0), 0).toLocaleString()} KWD`, 
      icon: Banknote, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      label: 'Active Users', 
      value: Array.from(new Set(bookings.map(b => b.userPhone))).length.toString(), 
      icon: Users, 
      color: 'text-[#695247]', 
      bg: 'bg-[#F6D1EE]/20' 
    },
  ];

  const calendarDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.customer.toLowerCase().includes(searchLower) ||
      booking.phone.includes(searchTerm) ||
      booking.date.includes(searchTerm) ||
      booking.id.toLowerCase().includes(searchLower)
    );
  });

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="text-brand-brown" />
            <span>{t('admin_panel')}</span>
          </h1>
          <p className="text-gray-500">Overview of your rental business</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <button 
            onClick={async () => { await signOut(auth); navigate('/'); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-brown text-white rounded-xl font-bold hover:bg-[#523f36] transition-colors shadow-lg shadow-gray-100">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 group hover:border-brand-pink/30 hover:shadow-md transition-all"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center border border-brand-pink/10`}>
              <stat.icon size={24} />
            </div>
            <p className="text-gray-500 font-medium text-sm">{stat.label}</p>
            <p className="text-2xl font-black">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Pricing Management Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Banknote size={24} className="text-brand-brown" />
            <span>Price Management</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-gray-400 uppercase tracking-widest self-center px-2">Defaults:</span>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{label}</span>
                  <input 
                    type="number" 
                    value={standardPrices[i]} 
                    onChange={(e) => setStandardPrices({ ...standardPrices, [i]: parseInt(e.target.value) || 0 })}
                    className="w-12 px-1 py-1 bg-white rounded-lg border border-gray-200 focus:ring-1 focus:ring-brand-brown text-center text-[10px] font-black"
                  />
                </div>
              ))}
              <button 
                onClick={saveStandardPrices}
                className="self-end p-2 bg-brand-brown text-white rounded-xl hover:bg-[#523f36] transition-colors shadow-sm"
                title="Save Defaults"
              >
                <Save size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Tool */}
        <div className="bg-brand-soft/30 p-4 rounded-3xl border border-brand-pink/10 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-xl">
              <Calendar size={18} className="text-brand-brown" />
            </div>
            <span className="font-bold text-sm text-brand-brown">Bulk Month Update:</span>
          </div>
          
          <div className="flex items-center gap-3 flex-grow md:flex-grow-0">
            <select 
              value={bulkDay}
              onChange={(e) => setBulkDay(parseInt(e.target.value))}
              className="px-4 py-2 bg-white border border-brand-pink/20 rounded-xl outline-none font-bold text-sm text-brand-brown"
            >
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">KWD</span>
              <input 
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="pl-10 pr-3 py-2 w-24 bg-white border border-brand-pink/20 rounded-xl outline-none font-black text-sm"
              />
            </div>

            <button 
              onClick={handleBulkUpdate}
              className="px-6 py-2 bg-brand-brown text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              Apply to {format(currentMonth, 'MMMM')}
            </button>
          </div>
          
          <p className="text-[10px] text-gray-400 font-medium italic">
            * This will override existing custom prices for all selected days in the active month.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <h3 className="text-lg font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-[10px] uppercase font-black text-gray-300 py-2">
                {day}
              </div>
            ))}
            {calendarDays().map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const customPrice = customPrices[dateStr];
              const dayOfWeek = day.getDay();
              const defaultPrice = standardPrices[dayOfWeek] || 150;
              const hasCustom = customPrice !== undefined;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`relative h-24 p-2 rounded-2xl border-2 transition-all text-left flex flex-col justify-between group ${
                    !isSameMonth(day, currentMonth) ? 'opacity-20 pointer-events-none' : ''
                  } ${
                    hasCustom 
                      ? 'bg-brand-soft border-brand-pink text-brand-brown' 
                      : 'bg-white border-gray-50 hover:border-brand-pink/30'
                  }`}
                >
                  <span className={`text-xs font-bold ${hasCustom ? 'text-brand-brown' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </span>
                  <div>
                    <p className={`text-sm font-black ${hasCustom ? 'text-brand-brown' : 'text-gray-900 group-hover:text-brand-brown transition-colors'}`}>
                      {customPrice || defaultPrice}
                    </p>
                    <p className="text-[8px] uppercase font-bold text-gray-300">KWD</p>
                  </div>
                  {hasCustom && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-brown rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Modal */}
      <AnimatePresence>
        {editingDay && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDay(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6"
            >
              <div className="text-center space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(parseISO(editingDay), 'EEEE, MMMM do')}</p>
                <h3 className="text-xl font-bold">Set Custom Price</h3>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">KWD</span>
                  <input 
                    type="number"
                    autoFocus
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Leave empty for default"
                    className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-brown rounded-2xl outline-none font-bold text-xl"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingDay(null)}
                    className="flex-grow py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePrice}
                    className="flex-grow py-4 bg-brand-brown text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-xl">{t('bookings')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-brand-brown w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-[#FFF8FD] text-brand-brown/60 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-brand-soft transition-colors group">
                  <td className="px-6 py-4 font-bold text-brand-brown">{booking.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{booking.customer}</div>
                    <div className="text-xs text-gray-400">{booking.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{booking.date}</div>
                    <div className="text-xs text-gray-400">{booking.nights} nights</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${
                      booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                      booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-[#F2EE91]/30 text-brand-brown'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black">{booking.total} KWD</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-brand-brown transition-colors">
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

