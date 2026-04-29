import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Contract = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isRTL = i18n.language === 'ar';

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-8"
      >
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brand-brown font-bold hover:gap-3 transition-all"
        >
          <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-soft border border-brand-pink/20 rounded-2xl text-brand-brown">
            <FileText size={32} />
          </div>
          <h1 className="text-3xl font-bold">{t('contract')}</h1>
        </div>

        <div className="prose prose-stone max-w-none text-gray-600 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">1. Introduction</h2>
            <p>
              This Rental Agreement ("Agreement") is made between VCAY ("Owner") and the Guest ("Guest") regarding the use of the beachfront property located in Al Khiran, Kuwait.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">2. Booking & Payment</h2>
            <p>
              All bookings must be paid in full at the time of reservation. A refundable insurance deposit of 150 KWD is mandatory and will be returned within 48 hours of checkout if no damages are identified.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">3. House Rules</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Maximum occupancy must not be exceeded.</li>
              <li>Guests must provide a valid marriage certificate for couples.</li>
              <li>No loud noise or music after 11 PM.</li>
              <li>Smoking is only permitted in outdoor balcony/garden areas.</li>
              <li>Any damages will be deducted from the insurance deposit.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">4. Cancellation Policy</h2>
            <p>
              Full refund for cancellations made 7 days prior to check-in. 50% refund for cancellations made 3 days prior. No refund for cancellations within 48 hours of check-in.
            </p>
          </section>

          <section className="bg-brand-soft p-6 rounded-2xl italic border-l-4 border-brand-pink">
            "By checking the agreement box during booking, you acknowledge that you have read and accepted all terms and conditions mentioned above."
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default Contract;
