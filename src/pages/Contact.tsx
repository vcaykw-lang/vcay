import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'motion/react';

const Contact = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-brand-brown">{t('contact')}</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            We are here to help you plan your perfect getaway. Reach out to us for any inquiries or special requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-soft border border-brand-pink/20 rounded-xl text-brand-brown">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold">Email</h3>
                <a href="mailto:vcaykw@gmail.com" className="text-gray-600 hover:text-brand-brown transition-colors">
                  vcaykw@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-soft border border-brand-pink/20 rounded-xl text-brand-brown">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold">WhatsApp / Phone</h3>
                <p className="text-gray-600">96729996</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-soft border border-brand-pink/20 rounded-xl text-brand-brown">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold">{t('location')}</h3>
                <p className="text-gray-600">28.679295, 48.339688</p>
                <a 
                  href="https://maps.app.goo.gl/EnNfFbwSAWRqzfY3A" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-brand-brown text-sm underline font-medium"
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none"
                placeholder="+965 5xxxxxxx"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Message</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 focus:border-brand-brown focus:bg-white transition-all rounded-xl outline-none"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="button"
              className="w-full py-4 bg-brand-brown text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#523f36] transition-colors"
            >
              <Send size={18} />
              <span>Send Message</span>
            </button>
          </form>
        </div>

        {/* Embedded Map Simulation */}
        <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden grayscale border border-gray-100">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d11128!2d48.339688!3d28.679295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2skw!4v1700000000000!5m2!1sen!2skw"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
