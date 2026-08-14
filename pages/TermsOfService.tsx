
import React, { useEffect } from 'react';
import { ScrollText, ArrowLeft, Shield, UserX, Lock, FileX, PowerOff, AlertTriangle, AlertOctagon, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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
        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase tracking-tight">Terms of <span className="text-brand-accent">Service</span></h1>
        <div className="h-1 w-full max-w-[100px] bg-gradient-to-r from-brand-accent to-transparent"></div>
      </div>

      <div className="bg-brand-surface border border-white/10 rounded-3xl p-6 md:p-12 space-y-12 text-slate-300 leading-relaxed relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] pointer-events-none"></div>
        
        {/* Intro Box */}
        <div className="flex items-start gap-5 p-6 bg-brand-dark/50 border border-brand-accent/20 rounded-2xl relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent rounded-l-2xl"></div>
            <ScrollText className="w-8 h-8 text-brand-accent shrink-0 mt-1" />
            <p className="text-sm md:text-base">
                By renting a Valorant ID from <strong>Krishna Valostore</strong>, you agree to abide by the following terms. Failure to comply will result in immediate termination of your rental without a refund.
            </p>
        </div>

        {/* Section 1 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-brand-cyan">
                    <Shield size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">1. Account Ownership & Usage</h2>
            </div>
            <div className="pl-11 space-y-4 text-sm md:text-base text-slate-400">
                <p>All accounts remain the sole property of Krishna Valostore.</p>
                <p>You are granted a temporary license to use the account for the duration of your paid rental period.</p>
                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                    <strong className="text-red-400 block mb-2 text-xs uppercase tracking-widest flex items-center gap-2"><AlertOctagon size={12}/> Prohibited</strong>
                    <p className="text-sm">
                       You are strictly forbidden from changing the account password, email, or linked social accounts. Any attempt to "recover" or steal the account will result in a permanent ban and legal reporting where applicable.
                    </p>
                </div>
            </div>
        </section>

        {/* Section 2 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-yellow-500">
                    <Gavel size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">2. Fair Play & Conduct</h2>
            </div>
            <div className="pl-11 grid md:grid-cols-2 gap-6">
                <div className="bg-brand-dark border border-white/10 p-5 rounded-xl">
                    <strong className="text-white block mb-2 text-xs uppercase tracking-widest">No Cheating</strong>
                    <p className="text-sm text-slate-400">
                        Use of any third-party software, hacks, scripts, or "internal" tools is strictly prohibited. If an account is banned by Riot Vanguard during your rental, you will be held liable for the full value of the account.
                    </p>
                </div>
                <div className="bg-brand-dark border border-white/10 p-5 rounded-xl">
                    <strong className="text-white block mb-2 text-xs uppercase tracking-widest">Toxicity</strong>
                    <p className="text-sm text-slate-400">
                        You must not engage in toxic behavior, chat abuse, or throwing games (griefing). If the account receives a communications ban, your rental will be terminated.
                    </p>
                </div>
            </div>
        </section>

        {/* Section 3 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-blue-400">
                    <Lock size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">3. Account Security</h2>
            </div>
            <div className="pl-11 space-y-4 text-sm md:text-base text-slate-400">
                <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2"></span>
                        <span>You are responsible for the account during your rental time. Do not share the login credentials provided to you with anyone else.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2"></span>
                        <span>If you lose access to the account, you must notify Krishna Valostore support immediately.</span>
                    </li>
                </ul>
            </div>
        </section>

        {/* Section 4 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-slate-400">
                    <FileX size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">4. No Refund Policy</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400">
                As stated in our Refund Policy, all payments are final. Once credentials are delivered, no refunds will be issued for "change of mind," technical issues on your PC, or being unable to play.
            </p>
        </section>

        {/* Section 5 */}
        <section className="relative">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-red-500">
                    <PowerOff size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">5. Termination of Service</h2>
            </div>
            <div className="pl-11 text-sm md:text-base text-slate-400">
                <p className="mb-3">We reserve the right to revoke account access at any time if:</p>
                <ul className="list-disc pl-5 space-y-1 marker:text-red-500">
                    <li>You violate any of the terms listed above.</li>
                    <li>Your rental time has expired.</li>
                    <li>You are found to be sharing the account with multiple users.</li>
                </ul>
            </div>
        </section>

        {/* Section 6 */}
        <section className="relative">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-purple-400">
                    <AlertTriangle size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">6. Limitation of Liability</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400">
                Krishna Valostore is not responsible for any technical issues related to Riot Games, Valorant servers, or your internet connection. We provide the account "as is" for the duration of the rental.
            </p>
        </section>

        {/* Footer Note */}
        <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm italic">
                "By proceeding with the payment, you confirm that you are at least 18 years old (or have parental consent) and agree to these terms."
            </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
