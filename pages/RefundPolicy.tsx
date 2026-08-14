
import React, { useEffect } from 'react';
import { ShieldAlert, ArrowLeft, AlertTriangle, Scale, Lock, RefreshCw, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const RefundPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase tracking-tight">Refund <span className="text-brand-accent">Policy</span></h1>
        <div className="h-1 w-full max-w-[100px] bg-gradient-to-r from-brand-accent to-transparent"></div>
      </div>

      <div className="bg-brand-surface border border-white/10 rounded-3xl p-6 md:p-12 space-y-12 text-slate-300 leading-relaxed relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[100px] pointer-events-none"></div>
        
        {/* Intro Box */}
        <div className="flex items-start gap-5 p-6 bg-brand-dark/50 border border-brand-accent/20 rounded-2xl relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent rounded-l-2xl"></div>
            <ShieldAlert className="w-8 h-8 text-brand-accent shrink-0 mt-1" />
            <p className="text-sm md:text-base">
                At <strong>Krishna Valostore</strong>, we provide premium Valorant account rentals. Because our services involve the immediate delivery of digital login credentials, we maintain a strict refund policy to ensure the security and integrity of our accounts. <br/><br/>
                Please read this policy carefully before completing your rental.
            </p>
        </div>

        {/* Section 1 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-brand-cyan">
                    <Lock size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">1. All Rentals are Final</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400">
                By purchasing a rental period from Krishna Valostore, you acknowledge and agree that all sales are final. Once the account credentials (username and password) have been sent to you via email, WhatsApp, or our automated system, no refunds will be issued under any circumstances.
            </p>
        </section>

        {/* Section 2 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-purple-400">
                    <Scale size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">2. Digital Nature of Service</h2>
            </div>
            <div className="pl-11 space-y-4 text-sm md:text-base text-slate-400">
                <p>
                    Our service is a digital rental. Unlike physical goods, digital access cannot be "returned." Once you have gained access to the account details, the service is considered fully rendered. Therefore:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="flex items-center gap-2 bg-brand-dark p-3 rounded-lg border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> We do not offer refunds if you "change your mind."
                    </li>
                    <li className="flex items-center gap-2 bg-brand-dark p-3 rounded-lg border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> We do not offer refunds if you rented the wrong account.
                    </li>
                    <li className="flex items-center gap-2 bg-brand-dark p-3 rounded-lg border border-white/5 md:col-span-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> We do not offer refunds for unused rental time.
                    </li>
                </ul>
            </div>
        </section>

        {/* Section 3 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-red-500">
                    <AlertTriangle size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">3. Account Bans and Restrictions</h2>
            </div>
            <div className="pl-11 grid md:grid-cols-2 gap-6">
                <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-xl">
                    <strong className="text-red-400 block mb-2 text-xs uppercase tracking-widest">User Misconduct</strong>
                    <p className="text-sm text-slate-400">
                        If the rented account is banned, restricted, or receives a communications penalty due to your actions (cheating, toxicity, scripting, or using third-party software), no refund will be provided, and you may be barred from future rentals.
                    </p>
                </div>
                <div className="bg-brand-dark border border-white/10 p-5 rounded-xl">
                    <strong className="text-white block mb-2 text-xs uppercase tracking-widest">Vanguard Issues</strong>
                    <p className="text-sm text-slate-400">
                        It is your responsibility to ensure your PC can run Valorant and that your Riot Vanguard is functioning. We do not offer refunds for technical issues on the user's side.
                    </p>
                </div>
            </div>
        </section>

        {/* Section 4 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-green-400">
                    <RefreshCw size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">4. Technical Issues & Replacements</h2>
            </div>
            <div className="pl-11 space-y-4 text-sm md:text-base text-slate-400">
                <p>
                    While we do not offer monetary refunds, we are committed to providing a working service.
                </p>
                <div className="border-l-2 border-brand-cyan pl-4 space-y-4">
                    <div>
                        <strong className="text-white text-sm uppercase tracking-wide">Invalid Credentials</strong>
                        <p className="mt-1">If the account credentials provided do not work at the start of your rental, you must contact us within 30 minutes of purchase.</p>
                    </div>
                    <div>
                        <strong className="text-white text-sm uppercase tracking-wide">Resolution</strong>
                        <p className="mt-1">If we verify the account is inaccessible, we will provide a replacement account of equal value or extend your rental time. We do not issue cash refunds in these cases.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Section 5 */}
        <section className="relative">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-yellow-500">
                    <CreditCard size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">5. Chargebacks</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400 bg-brand-dark p-4 rounded-xl border border-white/5">
                Any attempt to initiate a chargeback or dispute a payment through your bank or payment gateway will result in a permanent ban from Krishna Valostore and any associated partner stores. We will provide this signed policy to the payment processor as evidence of our "No Refund" agreement.
            </p>
        </section>
      </div>

      <div className="mt-12 text-center">
         <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Policy Last Updated: December 2024</p>
         <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
            <span className="text-white font-bold text-sm">Krishna Valostore Management</span>
         </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
