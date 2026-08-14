
import React, { useEffect } from 'react';
import { ArrowLeft, MessageCircle, HelpCircle, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactUs: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/919860185116', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase tracking-tight">Contact <span className="text-brand-accent">Support</span></h1>
        <div className="h-1 w-full max-w-[100px] bg-gradient-to-r from-brand-accent to-transparent"></div>
      </div>

      <div className="bg-brand-surface border border-white/10 rounded-3xl p-6 md:p-12 space-y-12 text-slate-300 leading-relaxed relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] pointer-events-none"></div>

        <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
                <HelpCircle className="w-10 h-10 text-brand-cyan" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">We're Here to Help</h2>
            <p className="text-slate-400 mb-8">
                Facing issues with your rental? Need help choosing an account? Our support team is available 24/7 to assist you.
            </p>

            <button 
                onClick={handleWhatsAppClick}
                className="w-full md:w-auto px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 uppercase tracking-wide text-sm"
            >
                <MessageCircle className="w-6 h-6" /> Chat on WhatsApp
            </button>
            
            <p className="mt-6 text-xs text-slate-500 font-mono">
                Typical response time: &lt; 5 minutes
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-12 border-t border-white/5">
            <div className="bg-brand-dark p-6 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-2 text-white font-bold uppercase tracking-wide text-sm">
                    <Mail size={16} className="text-brand-accent" /> Email Support
                </div>
                <p className="text-slate-400 text-sm mb-4">For business inquiries or bulk orders.</p>
                <a href="mailto:support@krishnavalo.store" className="text-brand-accent hover:text-white transition-colors text-sm font-mono">support@krishnavalo.store</a>
            </div>
            
             <div className="bg-brand-dark p-6 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-2 text-white font-bold uppercase tracking-wide text-sm">
                    <Phone size={16} className="text-brand-cyan" /> Emergency Line
                </div>
                <p className="text-slate-400 text-sm mb-4">Urgent account access issues only.</p>
                <span className="text-brand-cyan text-sm font-mono">+91 98601 85116</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
