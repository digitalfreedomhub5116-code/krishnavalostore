
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Loader2, Gamepad2, AlertTriangle, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { StorageService } from '../services/storage';

const UserAuth: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve redirect state if user came from a booking attempt
  const { returnTo, checkoutState } = location.state || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name || !email || !phone || !password) {
           throw new Error("All fields are required");
        }
        await StorageService.registerUser(name, email, phone, password);
      } else {
        if (!email || !password) {
           throw new Error("Please enter email and password");
        }
        await StorageService.loginUser(email, password);
      }

      // Success Redirect
      if (returnTo && checkoutState) {
        navigate(returnTo, { state: checkoutState });
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || (typeof err === 'string' ? err : 'Authentication failed'));
      setLoading(false);
    }
  };

  const handleGuestBrowsing = () => {
    navigate('/browse');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden py-10">
        {/* Animated Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="relative inline-block mb-4 group">
                   <div className="absolute inset-0 bg-brand-accent blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                   <div className="relative p-4 rounded-2xl bg-brand-surface border border-white/10 shadow-[0_0_30px_rgba(255,70,85,0.15)]">
                      <Shield className="w-10 h-10 text-brand-accent" strokeWidth={1.5} />
                   </div>
                </div>

                <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-wide">
                    {isRegistering ? 'JOIN THE ELITE' : 'WELCOME BACK'}
                </h1>
                <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                    {isRegistering ? 'Create your agent profile to start renting.' : 'Login to access your rentals and dashboard.'}
                </p>
            </div>

            {/* Auth Card */}
            <div className="bg-brand-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                {/* Top highlight line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50"></div>
                
                {returnTo && (
                  <div className="mb-6 bg-brand-accent/10 border border-brand-accent/20 rounded-lg p-3 flex items-start gap-3 animate-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 text-brand-accent shrink-0" />
                    <div className="text-sm">
                      <p className="font-bold text-white">Login Required</p>
                      <p className="text-brand-accent/80 text-xs">Please sign in to complete your booking.</p>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {isRegistering && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Agent Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-accent focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input 
                            type="tel" 
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-accent focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="agent@gmail.com"
                        className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-accent focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-accent focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 py-2 rounded animate-shake">{error}</p>}

                  <button 
                      type="submit"
                      disabled={loading}
                      className="w-full relative group bg-white hover:bg-brand-accent text-brand-darker hover:text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,70,85,0.4)] hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-6"
                  >
                      {loading ? (
                          <>
                             <Loader2 className="w-5 h-5 animate-spin" />
                             <span>Processing...</span>
                          </>
                      ) : (
                          <>
                              <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                      )}
                  </button>
                </form>

                {/* Toggle Register/Login */}
                <div className="text-center mt-6 pt-4 border-t border-white/5">
                  <p className="text-sm text-slate-400">
                    {isRegistering ? "Already have an ID?" : "New to Krishna Valo?"}
                    <button 
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                      }}
                      className="ml-2 text-brand-cyan hover:text-white font-bold hover:underline underline-offset-4 transition-colors"
                    >
                      {isRegistering ? "Login Here" : "Register Now"}
                    </button>
                  </p>
                </div>

                {/* Guest Button */}
                <div className="mt-4">
                  <button 
                      onClick={handleGuestBrowsing}
                      className="w-full py-3 rounded-xl border border-white/5 hover:bg-white/5 text-slate-500 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 group uppercase tracking-widest"
                  >
                      <Gamepad2 className="w-3 h-3 group-hover:text-brand-cyan transition-colors" />
                      Continue as Guest
                  </button>
                </div>
            </div>
            
            <p className="text-center text-[10px] text-slate-600 mt-6">
              By continuing, you agree to our Terms of Service.
            </p>
        </div>
    </div>
  );
};

export default UserAuth;
