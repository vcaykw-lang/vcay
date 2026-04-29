import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Calculator, CreditCard, FileText, Calendar } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';

const Book = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: '+965',
    package: 'weekdays',
    nights: 1,
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    insurance: false,
    contract: false,
    notes: '',
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [breakdown, setBreakdown] = useState<{ date: string; price: number }[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login', { state: { from: '/book' } });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const [stdPrices, setStdPrices] = useState<Record<number, number>>({
    0: 150, 1: 150, 2: 150, 3: 150, 4: 200, 5: 200, 6: 200
  });
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    // Real-time prices
    const unsub = onSnapshot(doc(db, 'settings', 'prices'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.standardPrices) setStdPrices(data.standardPrices);
        if (data.customPrices) setCustomPrices(data.customPrices);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/prices');
    });

    return () => unsub();
  }, []);

  const calculateTotalPrice = (startDateStr: string, numNights: number) => {
    let total = 0;
    const items: { date: string; price: number }[] = [];
    const start = parseISO(startDateStr);
    
    for (let i = 0; i < numNights; i++) {
      const current = addDays(start, i);
      const dateStr = format(current, 'yyyy-MM-dd');
      const dayOfWeek = current.getDay();

      let price: number;

      // Check custom prices first
      if (customPrices[dateStr] !== undefined) {
        price = customPrices[dateStr];
      } else {
        price = stdPrices[dayOfWeek] || 150;
      }

      total += price;
      items.push({ date: format(current, 'EEE, MMM d'), price });
    }

    if (formData.insurance) {
      total += 150;
    }

    setTotalPrice(total);
    setBreakdown(items);
  };

  useEffect(() => {
    calculateTotalPrice(formData.checkIn, formData.nights);
  }, [formData.checkIn, formData.nights, formData.insurance]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.contract) return;
    
    const user = auth.currentUser;
    if (!user) {
      navigate('/login', { state: { from: '/book' } });
      return;
    }

    const bookingData = {
      customer: `${formData.firstName} ${formData.lastName}`,
      phone: `${formData.countryCode}${formData.phone}`,
      date: formData.checkIn,
      nights: Number(formData.nights),
      total: totalPrice,
      status: 'Confirmed',
      userId: user.uid,
      email: user.email || '',
      userPhone: user.phoneNumber || '',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'bookings'), bookingData);
      navigate('/success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
    }
  };

  // Removed unused isRTL
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-brand-brown">{t('book')}</h1>
          <p className="text-gray-500">
            {i18n.language === 'ar' 
              ? `الأسعار تبدأ من ${stdPrices[0]} د.ك`
              : `Prices start from ${stdPrices[0]} KWD`
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Info */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText size={20} className="text-brand-brown" />
              <span>Personal Information</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">{t('first_name')}</label>
                <input
                  required
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">{t('last_name')}</label>
                <input
                  required
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">{t('phone_number')}</label>
              <div className="flex gap-2">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="w-24 px-2 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none text-sm"
                >
                  <option value="+965">🇰🇼 +965</option>
                  <option value="+966">🇸🇦 +966</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+974">🇶🇦 +974</option>
                </select>
                <input
                  required
                  type="tel"
                  name="phone"
                  placeholder={t('phone_placeholder')}
                  value={formData.phone}
                  onChange={handleChange}
                  className="flex-grow px-4 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">{t('marriage_cert')}</label>
              <input
                required
                type="file"
                className="w-full px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-pink file:text-brand-brown hover:file:bg-brand-pink/80"
              />
            </div>
          </section>

          {/* Booking Details */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar size={20} className="text-brand-brown" />
              <span>Booking Details</span>
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">{t('nights')}</label>
                <select
                  name="nights"
                  value={formData.nights}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none"
                >
                  {[1, 3, 4, 5, 7, 14].map(n => (
                    <option key={n} value={n}>{n} {t('nights')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase">{t('check_in')}</label>
              <input
                required
                type="date"
                name="checkIn"
                min={format(new Date(), 'yyyy-MM-dd')}
                value={formData.checkIn}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none"
              />
            </div>
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="insurance"
                    checked={formData.insurance}
                    onChange={handleChange}
                    className="peer hidden"
                  />
                  <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-brand-brown peer-checked:border-brand-brown transition-all"></div>
                </div>
                <span className="text-sm leading-tight text-gray-600 group-hover:text-brand-brown transition-colors">
                  {t('insurance_agree')}
                </span>
              </label>
            </div>
          </section>

          {/* Pricing Summary */}
          <section className="md:col-span-2 bg-brand-soft p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calculator size={24} className="text-brand-brown" />
                <span>{t('price_breakdown')}</span>
              </h2>
              <div className="text-right">
                <p className="text-3xl font-black text-brand-brown">{totalPrice} <span className="text-sm font-bold uppercase">{t('kwd')}</span></p>
                <p className="text-xs text-gray-400 uppercase italic">All taxes included</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {breakdown.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-white hover:border-brand-pink/30 transition-colors">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">{item.date}</p>
                  <p className="text-lg font-bold">{item.price} {t('kwd')}</p>
                </div>
              ))}
              {formData.insurance && (
                <div className="bg-brand-pink/20 p-4 rounded-2xl border border-brand-pink/30 italic">
                  <p className="text-xs font-bold text-brand-brown uppercase mb-1">Insurance</p>
                  <p className="text-lg font-bold text-brand-brown">+150 {t('kwd')}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="contract"
                      checked={formData.contract}
                      onChange={handleChange}
                      className="peer hidden"
                    />
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-brand-brown peer-checked:border-brand-brown transition-all"></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {t('contract_agree')} (
                    <button 
                      type="button"
                      onClick={() => navigate('/contract')} 
                      className="text-brand-brown font-bold underline hover:text-black"
                    >
                      {t('contract')}
                    </button>)
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!formData.contract}
                  className="w-full py-5 bg-brand-brown text-white rounded-2xl text-xl font-bold shadow-lg shadow-gray-200 hover:bg-[#523f36] disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <CreditCard size={24} />
                  <span>{t('confirm_pay')}</span>
                </button>
                
                <div className="flex justify-center gap-4 py-2 grayscale opacity-40">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Apple_Pay_logo.svg" alt="Apple Pay" className="h-6" />
                </div>
              </div>
            </div>
          </section>
        </form>
      </motion.div>
    </div>
  );
};

export default Book;
