import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 text-center max-w-lg space-y-8"
      >
        <div className="w-24 h-24 bg-brand-soft border border-brand-pink/20 text-brand-brown rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={64} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-brand-brown">Booking Confirmed!</h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Thank you for choosing VCAY. Your beach escape is officially secured. We've sent the details to your WhatsApp.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex-grow py-4 px-8 bg-brand-brown text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#523f36] transition-all shadow-lg shadow-gray-100"
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={20} />
          </button>
          <button className="flex-grow py-4 px-8 bg-brand-soft text-brand-brown rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-pink/20 transition-all border border-brand-pink/30">
            <Download size={20} />
            <span>Invoice PDF</span>
          </button>
        </div>

        <p className="text-sm text-gray-400 mt-8">Booking reference: #BK-1052</p>
      </motion.div>
    </div>
  );
};

export default Success;
