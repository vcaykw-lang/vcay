import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Waves, Calendar, ShieldCheck, Layers, ArrowUpCircle, BedDouble, Bed, User, Gamepad2, Utensils, Armchair, ToyBrick, Ship } from 'lucide-react';

const Home = () => {
  const { t } = useTranslation();

  const facilities = [
    { icon: <Layers size={24} />, label: t('facility_floors') },
    { icon: <ArrowUpCircle size={24} />, label: t('facility_elevator') },
    { icon: <BedDouble size={24} />, label: t('facility_master_bedrooms') },
    { icon: <Bed size={24} />, label: t('facility_standard_bedrooms') },
    { icon: <User size={24} />, label: t('facility_maid_room') },
    { icon: <Gamepad2 size={24} />, label: t('facility_game_room') },
    { icon: <Utensils size={24} />, label: t('facility_kitchen') },
    { icon: <Armchair size={24} />, label: t('facility_outdoor_seating') },
    { icon: <ToyBrick size={24} />, label: t('facility_playground') },
    { icon: <Waves size={24} />, label: t('facility_pool') },
    { icon: <Ship size={24} />, label: t('facility_kayak') },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-brand-soft">
        
        <div className="relative z-10 text-center px-4 space-y-8 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-brand-brown tracking-tighter"
          >
            {t('brand')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-brand-brown/80 font-light"
          >
            Your ultimate beach escape in Kuwait.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Link
              to="/book"
              className="inline-flex items-center space-x-3 rtl:space-x-reverse px-8 py-4 bg-brand-brown text-white rounded-full text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-xl shadow-brand-brown/20"
            >
              <span>{t('rent_now')}</span>
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-24 px-4 bg-brand-soft/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-brand-brown tracking-tight">
              {t('facilities_title')}
            </h2>
            <div className="w-12 h-1.5 bg-brand-pink mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {facilities.map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-3xl border border-brand-pink/10 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4"
              >
                <div className="text-brand-brown bg-brand-soft p-3 rounded-2xl">
                  {facility.icon}
                </div>
                <span className="font-bold text-gray-700 text-sm md:text-base leading-tight">
                  {facility.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-brand-soft rounded-2xl flex items-center justify-center text-brand-brown border border-brand-pink/20">
                <Waves size={32} />
              </div>
              <h3 className="text-xl font-bold">{t('feature_beach_title')}</h3>
              <p className="text-gray-500 text-sm">{t('feature_beach_desc')}</p>
            </div>
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-brand-soft rounded-2xl flex items-center justify-center text-brand-brown border border-brand-pink/20">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-bold">{t('feature_booking_title')}</h3>
              <p className="text-gray-500 text-sm">{t('feature_booking_desc')}</p>
            </div>
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-brand-soft rounded-2xl flex items-center justify-center text-brand-brown border border-brand-pink/20">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold">{t('feature_service_title')}</h3>
              <p className="text-gray-500 text-sm">{t('feature_service_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
