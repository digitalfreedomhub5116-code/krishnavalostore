
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Account, UPI_ID, BookingStatus, Booking, PaymentConfig } from '../types';
import { Copy, ArrowRight, Timer, CalendarClock, Smartphone, ShieldCheck, Zap, Ticket, CheckCircle, XCircle, Loader2, AlertCircle, MessageCircle, CreditCard, Lock, Check, Eye, EyeOff } from 'lucide-react';
import { StorageService, SITE_LOGO_URL } from '../services/storage';

interface CheckoutState {
  orderId?: string; // Optional because legacy flow might not have it, but new flow will
  account: Account;
  hours: number;
  price: number;
  originalPrice?: number;
  durationLabel: '1 Hour' | '3 Hours' | '12 Hours' | '24 Hours';
  startMode: 'now' | 'later';
  scheduledTime?: string;
}

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CheckoutState;
  
  const [orderId, setOrderId] = useState(state?.orderId || '');
  const [timer, setTimer] = useState(600); // 10 minutes for payment
  const [error, setError] = useState('');
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);

  // Instant Delivered Credentials State
  const [deliveredCredentials, setDeliveredCredentials] = useState<{
    accountName: string;
    rank: string;
    username: string;
    password: string;
    orderId: string;
    endTime: string;
    durationLabel: string;
    whatsappUrl: string;
  } | null>(null);
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
  
  // Dynamic Payment Settings
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    companyName: 'Krishna Valo Store',
    upiId: UPI_ID,
    qrCodeUrl: '',
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_live_Td1pJL2txvaNnH'
  });

  useEffect(() => {
    StorageService.getHomeConfig().then(cfg => {
      if (cfg.payment) {
        setPaymentConfig(cfg.payment);
      }
    });
  }, []);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: 'PERCENT' | 'FLAT'; value: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const currentUser = StorageService.getOrCreateGuestUser();

  useEffect(() => {
    if (state && !state.orderId) {
      // Fallback generation if no pre-locked ID (Legacy support)
      const id = 'KV-' + Math.floor(1000 + Math.random() * 9000);
      setOrderId(id);
    }
  }, [state]);

  // Payment Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
       // Timer expired - navigate away or show error
       setError("Session expired.");
    }
  }, [timer]);

  if (!state) {
    return <Navigate to="/browse" />;
  }

  // Calculate rental period for display
  const startDateTime = state.startMode === 'later' && state.scheduledTime 
    ? new Date(state.scheduledTime) 
    : new Date();
    
  const endDateTime = new Date(startDateTime.getTime() + state.hours * 60 * 60 * 1000);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Price Calculations ---
  const basePrice = state.price;
  let finalPrice = basePrice;
  let discountAmount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENT') {
      discountAmount = Math.floor((basePrice * appliedCoupon.value) / 100);
    } else {
      discountAmount = appliedCoupon.value;
    }
    // Prevent negative price
    if (discountAmount > basePrice) discountAmount = basePrice;
    finalPrice = basePrice - discountAmount;
  }

  const activeCompanyName = paymentConfig.companyName || 'Krishna Valo Store';

  // --- Coupon Handlers ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponMessage(null);
    setAppliedCoupon(null);

    try {
      const result = await StorageService.validateCoupon(couponCode);
      if (result.valid && result.type && result.value) {
         setAppliedCoupon({ code: couponCode.toUpperCase(), type: result.type, value: result.value });
         setCouponMessage({ type: 'success', text: result.message });
      } else {
         setCouponMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setCouponMessage({ type: 'error', text: "Verification failed. Try again." });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const completeOrderWithPayment = async (paymentRef: string) => {
    // Increment Coupon usage if applied
    if (appliedCoupon) {
       await StorageService.incrementCouponUsage(appliedCoupon.code);
    }

    // Fetch fresh authoritative credentials from Supabase
    const accountRecord = await StorageService.getAccountById(state.account.id);
    const username = accountRecord?.username || state.account.username || 'Contact Support';
    const password = accountRecord?.password || state.account.password || 'Contact Support';

    // Mark booking as ACTIVE immediately (Instant Automated Unlock)
    const booking: Booking = {
      orderId,
      accountId: state.account.id,
      accountName: state.account.name,
      durationLabel: state.durationLabel,
      hours: state.hours,
      totalPrice: finalPrice,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      status: BookingStatus.ACTIVE, 
      createdAt: new Date().toISOString(),
      utr: paymentRef,
      customerId: currentUser?.id,
      customerName: currentUser?.name,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountApplied: appliedCoupon ? discountAmount : undefined
    };

    if (state.orderId) {
      await StorageService.updateBooking(booking);
    } else {
      await StorageService.createBooking(booking);
    }

    // Update account booked state in Supabase
    if (accountRecord) {
      accountRecord.isBooked = true;
      accountRecord.bookedUntil = endDateTime.toISOString();
      await StorageService.saveAccount(accountRecord);
    }

    // Construct WhatsApp message
    const timeString = state.startMode === 'later' 
      ? startDateTime.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : "Immediate";

    let message = `
*PAYMENT COMPLETED (RAZORPAY)*
---------------------
*Order ID:* ${orderId}
*Valorant ID:* ${state.account.name}
*Duration:* ${state.durationLabel}
*Price:* ₹${finalPrice}`;

    if (appliedCoupon) {
      message += `\n*Coupon:* ${appliedCoupon.code} (-₹${discountAmount})`;
    }

    message += `\n*Start Time:* ${timeString}
*Razorpay Payment ID:* ${paymentRef}
---------------------
Credentials automatically issued on screen.
    `.trim();

    const whatsappUrl = `https://wa.me/919860185116?text=${encodeURIComponent(message)}`;

    // Deliver credentials instantly directly on the screen
    setDeliveredCredentials({
      accountName: state.account.name,
      rank: state.account.rank,
      username,
      password,
      orderId,
      endTime: endDateTime.toISOString(),
      durationLabel: state.durationLabel,
      whatsappUrl
    });
  };

  const handleRazorpayPayment = async () => {
    setIsProcessingRazorpay(true);
    setError('');

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('Unable to load Razorpay payment SDK. Please check your internet connection and retry.');
      setIsProcessingRazorpay(false);
      return;
    }

    const razorpayKey = paymentConfig.razorpayKeyId || 'rzp_live_Td1pJL2txvaNnH';

    const options = {
      key: razorpayKey,
      amount: Math.round(finalPrice * 100), // In paise
      currency: 'INR',
      name: activeCompanyName,
      description: `Rental: ${state.account.name} (${state.durationLabel}) - Order #${orderId}`,
      image: SITE_LOGO_URL,
      prefill: {
        name: currentUser?.name && !currentUser.isGuest ? currentUser.name : '',
        email: currentUser?.email && !currentUser.isGuest ? currentUser.email : '',
        contact: currentUser?.phone || ''
      },
      theme: {
        color: '#ff4655'
      },
      modal: {
        ondismiss: function() {
          setIsProcessingRazorpay(false);
        }
      },
      handler: async function(response: any) {
        if (response && response.razorpay_payment_id) {
          try {
            await completeOrderWithPayment(response.razorpay_payment_id);
          } catch (err: any) {
            setError(err.message || 'Error recording order after payment.');
          }
        } else {
          setError('Payment completed but payment ID was not received.');
        }
        setIsProcessingRazorpay(false);
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function(resp: any) {
        setError(`Payment Failed: ${resp.error?.description || 'Transaction was declined.'}`);
        setIsProcessingRazorpay(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Razorpay checkout.');
      setIsProcessingRazorpay(false);
    }
  };

  const handleCopy = (text: string, field: 'username' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- RENDER: INSTANT CREDENTIAL DELIVERY SCREEN ---
  if (deliveredCredentials) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-brand-surface border border-green-500/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.15)]">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 via-brand-cyan to-green-500 animate-pulse"></div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 mb-3 shadow-[0_0_25px_rgba(34,197,94,0.3)]">
              <CheckCircle className="w-9 h-9" />
            </div>
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase tracking-widest mb-2 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              Payment Confirmed // Order #{deliveredCredentials.orderId}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase italic tracking-wide">
              Credentials Delivered!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Your rental for <span className="text-brand-cyan font-bold">{deliveredCredentials.accountName}</span> ({deliveredCredentials.durationLabel}) is now active. Log into the Riot Games client using the credentials below:
            </p>
          </div>

          {/* Credentials Display Box */}
          <div className="bg-brand-dark/95 border border-white/10 rounded-xl p-5 mb-6 space-y-4 shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-cyan">
                <Lock size={14} /> Riot Client Login Details
              </div>
              <span className="text-[10px] text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded border border-green-500/20 font-bold uppercase tracking-wider">
                ✓ Ready to Play
              </span>
            </div>

            {/* Username Row */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Riot ID / Username
              </label>
              <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-lg px-4 py-3 group hover:border-brand-cyan/40 transition-colors">
                <code className="text-base sm:text-lg font-mono font-bold text-white tracking-wide select-all truncate pr-2">
                  {deliveredCredentials.username}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(deliveredCredentials.username, 'username')}
                  className="ml-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0"
                >
                  {copiedField === 'username' ? (
                    <>
                      <Check size={14} className="text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Password Row */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Riot Password
              </label>
              <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-lg px-4 py-3 group hover:border-brand-accent/40 transition-colors">
                <code className="text-base sm:text-lg font-mono font-bold text-brand-accent tracking-wide select-all truncate pr-2">
                  {isPasswordRevealed ? deliveredCredentials.password : '••••••••••••'}
                </code>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPasswordRevealed(!isPasswordRevealed)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition-colors"
                    title={isPasswordRevealed ? "Hide Password" : "Show Password"}
                  >
                    {isPasswordRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(deliveredCredentials.password, 'password')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    {copiedField === 'password' ? (
                      <>
                        <Check size={14} className="text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Session Expiry Info */}
          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 mb-6 text-xs">
            <span className="text-slate-400 font-medium">Session Valid Until:</span>
            <span className="text-white font-mono font-bold">
              {new Date(deliveredCredentials.endTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Account Protection Policy */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 text-xs text-yellow-300/90 leading-relaxed flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block text-yellow-400 mb-1">
                Security & Anti-Ban Notice
              </span>
              Do not change the Riot password, registered email, or display name. Any tampering triggers immediate Vanguard blacklisting and loss of account access.
            </div>
          </div>

          {/* Action Navigation */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-gradient-to-r from-brand-accent to-red-600 hover:from-red-600 hover:to-brand-accent text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_30px_rgba(255,70,85,0.4)] hover:shadow-[0_0_40px_rgba(255,70,85,0.6)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Renter Dashboard</span>
              <ArrowRight size={18} />
            </button>

            <a
              href={deliveredCredentials.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-green-600/10 hover:bg-green-600/20 border border-green-500/30 text-green-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 no-underline"
            >
              <MessageCircle size={16} />
              <span>Save / Backup to WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              ← Back to Inventory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-32">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm">
        <span onClick={() => navigate('/browse')} className="cursor-pointer hover:text-white">Browse</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-white">Checkout</span>
      </div>

      <div className="space-y-6">

         {/* SECTION 1: TIMER */}
         <div className="bg-brand-surface border border-brand-accent/30 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(255,70,85,0.1)]">
             <div className="flex items-center gap-2 text-brand-accent">
               <Timer className="w-5 h-5" />
               <span className="font-bold">Session Time</span>
             </div>
             <div className="font-mono text-xl font-bold">{formatTimer(timer)}</div>
         </div>

         {/* SECTION 2: ORDER SUMMARY (Top) */}
         <div className="bg-brand-surface border border-white/10 rounded-xl p-6 relative overflow-hidden">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <span className="w-8 h-8 rounded-full bg-brand-surface border border-white/20 flex items-center justify-center text-sm text-slate-400">1</span>
               Order Summary
            </h2>
            
            <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-white/10">
               <div className="flex items-start gap-4 flex-1">
                  <img src={state.account.imageUrl} className="w-24 h-24 rounded-lg object-cover border border-white/10" alt="" />
                  <div>
                    <h3 className="font-bold text-xl text-white">{state.account.name}</h3>
                    <div className="mt-1 inline-block text-xs font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded border border-brand-secondary/20 uppercase tracking-wider">
                      {state.account.rank}
                    </div>
                    <div className="text-sm text-slate-400 mt-2 font-mono">Order: {orderId}</div>
                  </div>
               </div>
               
               {/* Totals Display */}
               <div className="flex-1 space-y-2 md:text-right">
                  <div className="flex justify-between md:justify-end gap-8 text-slate-300">
                    <span>Duration</span>
                    <span className="text-white font-bold">{state.durationLabel}</span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-8 text-slate-300">
                    <span>Subtotal</span>
                    <span className={state.originalPrice ? 'line-through text-slate-500' : 'text-white'}>
                       ₹{state.originalPrice || state.price}
                    </span>
                  </div>
                  {state.originalPrice && (
                     <div className="flex justify-between md:justify-end gap-8 text-brand-accent font-bold text-sm">
                        <span>24h Discount</span>
                        <span>-₹{(state.originalPrice - state.price).toFixed(0)}</span>
                     </div>
                  )}
                  {appliedCoupon && (
                     <div className="flex justify-between md:justify-end gap-8 text-green-400 font-bold text-sm">
                        <span>Coupon ({appliedCoupon.code})</span>
                        <span>-₹{discountAmount}</span>
                     </div>
                  )}
                  <div className="flex justify-between md:justify-end gap-8 items-center pt-2 border-t border-white/10 mt-2">
                    <span className="font-bold text-lg">Total Pay</span>
                    <span className="font-bold text-2xl text-brand-accent">₹{finalPrice}</span>
                  </div>
               </div>
            </div>

            {/* Schedule & Coupon Block */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Schedule */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-3 text-brand-accent font-bold text-sm uppercase tracking-wide">
                        <CalendarClock className="w-4 h-4" /> Schedule
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Start Time</span>
                            <span className="text-white font-mono">
                                {state.startMode === 'now' 
                                ? 'Immediate' 
                                : startDateTime.toLocaleString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">End Time</span>
                            <span className="text-white font-mono">
                                {endDateTime.toLocaleString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Coupon */}
                <div>
                     <div className="relative h-full">
                        {appliedCoupon ? (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex justify-between items-center h-full">
                             <div className="flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-green-400" />
                                <div>
                                   <div className="text-sm text-green-400 font-bold uppercase tracking-wider">{appliedCoupon.code}</div>
                                   <div className="text-[10px] text-green-300">Discount Applied</div>
                                </div>
                             </div>
                             <button onClick={removeCoupon} className="text-slate-500 hover:text-white p-2"><XCircle className="w-5 h-5" /></button>
                          </div>
                        ) : (
                          <div className="flex gap-2 h-full items-start">
                             <div className="relative flex-1">
                                <Ticket className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input 
                                  type="text" 
                                  placeholder="COUPON CODE"
                                  value={couponCode}
                                  onChange={(e) => {
                                     setCouponCode(e.target.value.toUpperCase());
                                     setCouponMessage(null);
                                  }}
                                  onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                  className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 pr-3 text-sm text-white focus:border-brand-accent outline-none font-mono uppercase"
                                />
                             </div>
                             <button 
                               onClick={handleApplyCoupon}
                               disabled={isValidatingCoupon || !couponCode}
                               className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 h-[46px]"
                             >
                               {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                             </button>
                          </div>
                        )}
                        {couponMessage && (
                           <div className={`text-[10px] mt-2 flex items-center gap-1.5 ${couponMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                              {couponMessage.type === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {couponMessage.text}
                           </div>
                        )}
                     </div>
                </div>
            </div>
         </div>

         {/* SECTION 2: PAY VIA RAZORPAY */}
         <div className="bg-brand-surface border border-white/10 rounded-xl p-5 sm:p-6 relative overflow-hidden">
             <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-accent flex items-center justify-center text-xs sm:text-sm text-white shadow-[0_0_15px_rgba(255,70,85,0.4)]">2</span>
                  Pay via Razorpay
                </h2>
                <span className="text-xl sm:text-2xl font-display font-black text-white">
                  ₹{finalPrice}
                </span>
             </div>

             {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-medium">
                   <AlertCircle size={14} className="shrink-0" />
                   {error}
                </div>
             )}

             <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={isProcessingRazorpay}
                className="w-full py-4 bg-gradient-to-r from-brand-accent to-red-600 hover:from-red-600 hover:to-brand-accent text-white font-black text-sm uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_0_25px_rgba(255,70,85,0.4)] hover:shadow-[0_0_35px_rgba(255,70,85,0.6)] hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
             >
                {isProcessingRazorpay ? (
                   <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting to Razorpay...</span>
                   </>
                ) : (
                   <>
                      <span>Pay ₹{finalPrice} via Razorpay</span>
                      <ArrowRight size={18} />
                   </>
                )}
             </button>
         </div>
      </div>
    </div>
  );
};

export default Checkout;
