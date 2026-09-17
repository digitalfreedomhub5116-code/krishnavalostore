
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Account, UPI_ID, BookingStatus, Booking, PaymentConfig } from '../types';
import { Copy, ArrowRight, Timer, CalendarClock, Smartphone, ShieldCheck, Zap, Send, Ticket, CheckCircle, XCircle, Loader2, AlertCircle, MessageCircle, CreditCard, QrCode, Lock, Check } from 'lucide-react';
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
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi'>('razorpay');
  
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

  const activeUpiId = paymentConfig.upiId || UPI_ID;
  const activeCompanyName = paymentConfig.companyName || 'Krishna Valo Store';

  // Construct UPI URI with amount and order ID
  // tn (Transaction Note) is critical here - it puts the Order ID in the bank statement for the admin
  const upiString = `upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(activeCompanyName)}&am=${finalPrice.toFixed(2)}&cu=INR&tn=${orderId}`;
  const qrCodeUrl = paymentConfig.qrCodeUrl?.trim()
    ? paymentConfig.qrCodeUrl
    : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(upiString)}`;

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

  const handleStartChat = () => {
    if (!currentUser) return;
    navigate('/dashboard', {
        state: {
            tab: 'messages',
            chatWith: state.account.listedBy,
            accountId: state.account.id
        }
    });
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

  const completeOrderWithPayment = async (paymentRef: string, gateway: 'Razorpay' | 'Manual UPI' = 'Razorpay') => {
    // Increment Coupon usage if applied
    if (appliedCoupon) {
       await StorageService.incrementCouponUsage(appliedCoupon.code);
    }

    if (state.orderId) {
       // Update existing PENDING booking
       const booking: Booking = {
         orderId,
         accountId: state.account.id,
         accountName: state.account.name,
         durationLabel: state.durationLabel,
         hours: state.hours,
         totalPrice: finalPrice, // Use discounted price
         startTime: startDateTime.toISOString(),
         endTime: endDateTime.toISOString(),
         status: BookingStatus.PENDING, 
         createdAt: new Date().toISOString(),
         utr: paymentRef,
         customerId: currentUser?.id,
         customerName: currentUser?.name,
         couponCode: appliedCoupon ? appliedCoupon.code : undefined,
         discountApplied: appliedCoupon ? discountAmount : undefined
       };
       await StorageService.updateBooking(booking);
    } else {
       // Legacy Fallback: Create new booking
       const newBooking: Booking = {
        orderId,
        accountId: state.account.id,
        accountName: state.account.name,
        durationLabel: state.durationLabel,
        hours: state.hours,
        totalPrice: finalPrice, // Use discounted price
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: BookingStatus.PENDING,
        createdAt: new Date().toISOString(),
        utr: paymentRef,
        customerId: currentUser?.id, // Link to logged in user
        customerName: currentUser?.name,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        discountApplied: appliedCoupon ? discountAmount : undefined
      };
      await StorageService.createBooking(newBooking);
    }

    // 2. Construct WhatsApp Message
    const timeString = state.startMode === 'later' 
      ? startDateTime.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : "Immediate";

    let message = `
*PAYMENT COMPLETED (${gateway.toUpperCase()})*
---------------------
*Order ID:* ${orderId}
*Valorant ID:* ${state.account.name}
*Duration:* ${state.durationLabel}
*Price:* ₹${finalPrice}`;

    if (appliedCoupon) {
      message += `\n*Coupon:* ${appliedCoupon.code} (-₹${discountAmount})`;
    }

    message += `\n*Start Time:* ${timeString}
*Payment ID / Ref:* ${paymentRef}
*Gateway:* ${gateway}
---------------------
Payment confirmed via ${gateway}. Please verify & deploy agent credentials.
    `.trim();

    // 3. Redirect to WhatsApp (Open in new tab to avoid iframe/preview blocks)
    const whatsappUrl = `https://wa.me/919860185116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // 4. Redirect user to Dashboard to track status
    navigate('/dashboard');
  };

  const handleRazorpayPayment = async () => {
    setIsProcessingRazorpay(true);
    setError('');

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('Unable to load Razorpay payment SDK. Please check your internet connection or switch to manual UPI below.');
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
            await completeOrderWithPayment(response.razorpay_payment_id, 'Razorpay');
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

  const handleSubmitPayment = async () => {
    if (!utr) {
      setError('Please enter the Transaction ID / UTR number.');
      return;
    }
    
    // Relaxed validation: Allow alphanumeric and check for reasonable length (e.g., 6+ chars)
    if (utr.length < 6) {
      setError('Invalid UTR. Please enter a valid reference ID.');
      return;
    }

    await completeOrderWithPayment(utr, 'Manual UPI');
  };

  const isUserListed = !!state.account.listedBy && state.account.listedBy !== currentUser?.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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
                    
                    {/* Chat with Owner Button */}
                    {isUserListed && currentUser && (
                        <button 
                            onClick={handleStartChat}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-dark hover:bg-brand-cyan/10 text-slate-300 hover:text-brand-cyan border border-white/10 hover:border-brand-cyan/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <MessageCircle size={14} />
                            Chat with Owner
                        </button>
                    )}
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

         {/* SECTION 2: PAYMENT & VERIFICATION */}
         <div className="bg-brand-surface border border-white/10 rounded-xl p-6 relative overflow-hidden">
             {/* Background Glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-3xl rounded-full pointer-events-none"></div>

             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-sm text-white shadow-[0_0_15px_rgba(255,70,85,0.4)]">2</span>
                  Select Payment Option
                </h2>

                {paymentConfig.razorpayEnabled !== false && (
                  <div className="flex p-1 bg-brand-dark rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        paymentMethod === 'razorpay'
                          ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap size={13} className="text-yellow-400" /> Razorpay Instant
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        paymentMethod === 'upi'
                          ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode size={13} /> Manual UPI QR
                    </button>
                  </div>
                )}
             </div>

             {/* Tab 1: Razorpay Instant 1-Click Gateway */}
             {paymentMethod === 'razorpay' && paymentConfig.razorpayEnabled !== false ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-accent/10 via-brand-surface to-brand-cyan/10 border border-brand-accent/30 shadow-2xl relative overflow-hidden">
                      <div className="flex items-start justify-between gap-4 mb-4">
                         <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Instant Automated Gateway
                            </span>
                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-wide">
                               Pay via Razorpay Gateway
                            </h3>
                            <p className="text-xs text-slate-300 mt-1">
                               Instant payment verification & delivery for <span className="text-brand-cyan font-bold">{activeCompanyName}</span>
                            </p>
                         </div>
                         <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="text-brand-cyan" size={26} />
                         </div>
                      </div>

                      {/* Supported Badges */}
                      <div className="space-y-2 py-4 border-y border-white/10">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Supported Payment Methods:</span>
                         <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-200">
                            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                               <Smartphone size={13} className="text-green-400" /> Google Pay / PhonePe / Paytm
                            </span>
                            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                               <CreditCard size={13} className="text-brand-cyan" /> Credit / Debit Cards
                            </span>
                            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                               NetBanking (All Banks)
                            </span>
                            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                               Wallets & Cred
                            </span>
                         </div>
                      </div>

                      <div className="flex justify-between items-center py-4">
                         <div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block">Total Payable</span>
                            <span className="text-3xl font-display font-black text-white">₹{finalPrice}</span>
                         </div>
                         <div className="text-right text-[11px] text-slate-400 font-mono">
                            <div>Zero Convenience Fee</div>
                            <div className="text-green-400 font-bold">✓ 256-bit Encrypted</div>
                         </div>
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
                         className="w-full py-5 bg-gradient-to-r from-brand-accent to-red-600 hover:from-red-600 hover:to-brand-accent text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_30px_rgba(255,70,85,0.4)] hover:shadow-[0_0_40px_rgba(255,70,85,0.6)] hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                         {isProcessingRazorpay ? (
                            <>
                               <Loader2 className="w-5 h-5 animate-spin" />
                               <span>Connecting to Razorpay...</span>
                            </>
                         ) : (
                            <>
                               <Zap size={18} className="text-yellow-400 fill-yellow-400" />
                               <span>PAY ₹{finalPrice} VIA RAZORPAY</span>
                               <ArrowRight size={18} />
                            </>
                         )}
                      </button>

                      <p className="text-[10px] text-center text-slate-500 mt-3 font-mono uppercase tracking-wider">
                         Secure 256-bit SSL // Instant verification upon completion
                      </p>
                   </div>

                   {/* Fallback to Manual UPI */}
                   <div className="text-center pt-2">
                      <button
                         type="button"
                         onClick={() => setPaymentMethod('upi')}
                         className="text-xs text-slate-400 hover:text-brand-cyan transition-colors underline underline-offset-4"
                      >
                         Prefer manual UPI transfer? Click here to scan QR or enter UTR
                      </button>
                   </div>
                </div>
             ) : (
                /* Tab 2: Manual UPI QR & UTR */
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* QR Code Column */}
                        <div className="flex flex-col items-center">
                           {/* Mobile Pay Button */}
                           <div className="md:hidden w-full mb-6">
                             <a 
                               href={upiString}
                               className="w-full bg-white text-brand-darker font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors animate-pulse no-underline"
                             >
                               <Smartphone className="w-6 h-6" />
                               Tap to Pay via UPI
                             </a>
                             <div className="flex items-center gap-2 justify-center mt-2 text-slate-500 text-xs">
                                 <span className="w-12 h-px bg-white/10"></span> OR <span className="w-12 h-px bg-white/10"></span>
                             </div>
                           </div>

                           <div className="bg-white p-4 rounded-xl shadow-inner relative group mx-auto flex items-center justify-center min-w-[200px] min-h-[200px]">
                             <img 
                               src={qrCodeUrl} 
                               alt="UPI QR Code" 
                               className="w-48 h-48 object-contain"
                             />
                             {/* Scan Overlay */}
                             <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent/50 animate-[scan_2s_infinite_linear] pointer-events-none" />
                           </div>
                           <div className="text-center mt-4">
                               <p className="text-slate-400 text-sm mb-1">Scan to pay <span className="text-white font-bold">{activeCompanyName}</span></p>
                               <p className="text-2xl font-black text-white">₹{finalPrice}</p>
                           </div>
                        </div>

                        {/* UTR Column */}
                        <div className="flex flex-col justify-center space-y-6">
                           <div className="bg-brand-dark p-4 rounded-lg border border-white/10">
                              <div className="text-xs text-slate-400 uppercase font-bold mb-2">Merchant UPI ID ({activeCompanyName})</div>
                              <div className="flex items-center justify-between">
                                 <span className="font-mono text-white text-lg">{activeUpiId}</span>
                                 <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(activeUpiId);
                                    }}
                                    className="text-brand-accent hover:text-white transition-colors"
                                    title="Copy UPI ID"
                                 >
                                   <Copy className="w-5 h-5" />
                                 </button>
                              </div>
                           </div>

                           <div className="border-t border-white/10 pt-6">
                               <label className="block text-sm font-bold text-white mb-2">
                                  Enter Payment Reference ID (UTR)
                                </label>
                               <input 
                                 type="text" 
                                 value={utr}
                                 onChange={(e) => {
                                   setUtr(e.target.value);
                                   setError('');
                                 }}
                                 placeholder="12-digit UTR (e.g. 3245xxxxxxxx)"
                                 className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-4 text-white focus:border-brand-accent focus:outline-none mb-2 font-mono text-lg tracking-widest placeholder:tracking-normal"
                                 maxLength={12}
                               />
                               {error && <p className="text-red-500 text-xs mb-3 font-bold flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}

                               <button 
                                 onClick={handleSubmitPayment}
                                 className="w-full bg-brand-accent hover:bg-red-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-accent/20 mt-2"
                               >
                                 <Send className="w-5 h-5" />
                                 VERIFY & BOOK SLOT
                               </button>
                               <p className="text-[10px] text-center mt-3 text-slate-500">
                                  Instant verification via WhatsApp protocol.
                               </p>
                           </div>
                        </div>
                    </div>

                    {paymentConfig.razorpayEnabled !== false && (
                       <div className="text-center pt-2">
                          <button
                             type="button"
                             onClick={() => setPaymentMethod('razorpay')}
                             className="text-xs text-brand-accent hover:text-white transition-colors font-bold uppercase tracking-wider"
                          >
                             ← Or switch back to Instant Razorpay Gateway
                          </button>
                       </div>
                    )}
                </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default Checkout;
