
import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Database, Eye, Lock, Globe, Cookie, Baby, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
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
        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase tracking-tight">Privacy <span className="text-brand-accent">Policy</span></h1>
        <div className="h-1 w-full max-w-[100px] bg-gradient-to-r from-brand-accent to-transparent"></div>
      </div>

      <div className="bg-brand-surface border border-white/10 rounded-3xl p-6 md:p-12 space-y-12 text-slate-300 leading-relaxed relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] pointer-events-none"></div>
        
        {/* Intro Box */}
        <div className="flex items-start gap-5 p-6 bg-brand-dark/50 border border-brand-accent/20 rounded-2xl relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent rounded-l-2xl"></div>
            <ShieldCheck className="w-8 h-8 text-brand-accent shrink-0 mt-1" />
            <p className="text-sm md:text-base">
                At <strong>Krishna Valostore</strong>, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information while you use our Valorant account rental services.
            </p>
        </div>

        {/* Section 1 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-brand-cyan">
                    <Database size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">1. Information We Collect</h2>
            </div>
            <div className="pl-11 space-y-4 text-sm md:text-base text-slate-400">
                <p>To provide a smooth rental experience, we may collect the following information:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="bg-brand-dark p-3 rounded-lg border border-white/5">
                        <strong className="text-white block mb-1 text-xs uppercase tracking-wide">Contact Information</strong>
                        Your name, email address, WhatsApp number, or Discord ID.
                    </li>
                    <li className="bg-brand-dark p-3 rounded-lg border border-white/5">
                        <strong className="text-white block mb-1 text-xs uppercase tracking-wide">Payment Details</strong>
                        Transaction IDs and payment confirmation. We do not store full credit card/bank details.
                    </li>
                    <li className="bg-brand-dark p-3 rounded-lg border border-white/5 md:col-span-2">
                        <strong className="text-white block mb-1 text-xs uppercase tracking-wide">Technical Data</strong>
                        IP addresses and device information used for security monitoring.
                    </li>
                </ul>
            </div>
        </section>

        {/* Section 2 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-purple-400">
                    <Eye size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">2. How We Use Your Information</h2>
            </div>
            <div className="pl-11 text-sm md:text-base text-slate-400">
                <ul className="space-y-3 list-disc list-inside marker:text-purple-400">
                    <li><strong className="text-slate-200">Service Delivery:</strong> To send you the login credentials for your rented Valorant ID.</li>
                    <li><strong className="text-slate-200">Customer Support:</strong> To assist you with login issues or technical difficulties.</li>
                    <li><strong className="text-slate-200">Security & Fraud Prevention:</strong> To monitor for unauthorized access and ensure Terms of Service compliance.</li>
                    <li><strong className="text-slate-200">Communication:</strong> To send updates regarding your rental status or promotional offers.</li>
                </ul>
            </div>
        </section>

        {/* Section 3 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-green-400">
                    <Lock size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">3. Data Protection and Security</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400 mb-4">
                We implement a variety of security measures to maintain the safety of your personal information:
            </p>
            <div className="pl-11 grid md:grid-cols-3 gap-4">
                <div className="bg-brand-dark border border-white/5 p-4 rounded-xl text-center">
                    <div className="text-green-400 font-bold text-xs uppercase mb-2">Account Safety</div>
                    <p className="text-xs text-slate-500">Credentials changed frequently to restrict access.</p>
                </div>
                <div className="bg-brand-dark border border-white/5 p-4 rounded-xl text-center">
                    <div className="text-green-400 font-bold text-xs uppercase mb-2">Limited Access</div>
                    <p className="text-xs text-slate-500">Only authorized staff have access to data.</p>
                </div>
                <div className="bg-brand-dark border border-white/5 p-4 rounded-xl text-center">
                    <div className="text-green-400 font-bold text-xs uppercase mb-2">Non-Disclosure</div>
                    <p className="text-xs text-slate-500">We do not sell your data to outside parties.</p>
                </div>
            </div>
        </section>

        {/* Section 4 */}
        <section className="relative">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-blue-400">
                    <Globe size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">4. Third-Party Services</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400">
                We may use third-party services (such as payment processors or messaging platforms like WhatsApp/Discord) to facilitate our business. These third parties have their own privacy policies, and we recommend you review them. We are not responsible for the privacy practices of these external services.
            </p>
        </section>

        {/* Section 5 */}
        <section className="relative">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-yellow-500">
                    <Cookie size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">5. Cookies and Tracking</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400">
                If you access our services via a website, we may use cookies to enhance your experience, remember your preferences, and track website traffic to improve our service. You can choose to disable cookies through your browser settings, though this may affect some site functionality.
            </p>
        </section>

        {/* Section 6 */}
        <section className="relative">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-red-400">
                    <Baby size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">6. Children's Privacy</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400">
                Our services are not intended for individuals under the age of 13. By using our service, you confirm that you are at least 13 years of age or have the consent of a parent or legal guardian.
            </p>
        </section>

        {/* Section 7 */}
        <section className="relative">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-slate-400">
                    <RefreshCw size={16} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">7. Changes to This Policy</h2>
            </div>
            <p className="pl-11 text-sm md:text-base text-slate-400">
                Krishna Valostore reserves the right to update this Privacy Policy at any time. Any changes will be posted on this page with an updated "Effective Date." We encourage users to check this page frequently to stay informed.
            </p>
        </section>

        {/* Footer Note */}
        <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm italic">
                Last Updated: December 2024
            </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
