
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Account, UPI_ID, Booking } from '../types';
import { StorageService } from '../services/storage';
import { Copy, ArrowRight, Timer, CalendarClock, Smartphone, ShieldCheck, Zap, Send } from 'lucide-react';

interface CheckoutState {
  orderId?: string; // Optional because legacy flow might not have it, but new flow will
  account: Account;
  hours: number;
  price: number;
  originalPrice?: number;
  durationLabel: '3 Hours' | '12 Hours' | '24 Hours';
  startMode: 'now' | 'later';
  scheduledTime?: string;
}

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CheckoutState;
  
  const [orderId, setOrderId] = useState(state?.orderId || '');
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');

  const currentUser = StorageService.getCurrentUser();

  useEffect(() => {
    if (state && !state.orderId) {
      // Fallback generation if no pre-locked ID (Legacy support)
      const id = 'KV-' + Math.floor(1000 + Math.random() * 9000);
      setOrderId(id);
    }
  }, [state]);

  if (!state) {
    return <Navigate to="/browse" />;
  }

  // Calculate rental period for display
  const startDateTime = state.startMode === 'later' && state.scheduledTime 
    ? new Date(state.scheduledTime) 
    : new Date();
    
  const endDateTime = new Date(startDateTime.getTime() + state.hours * 60 * 60 * 1000);

  // Construct UPI URI with amount and order ID
  // tn (Transaction Note) is critical here - it puts the Order ID in the bank statement for the admin
  const upiString = `upi://pay?pa=${UPI_ID}&pn=KrishnaValo&am=${state.price.toFixed(2)}&cu=INR&tn=${orderId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(upiString)}`;

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

    // Always create new booking entry since we removed pre-locking
    const booking: Booking = {
      orderId,
      accountId: state.account.id,
      accountName: state.account.name,
      durationLabel: state.durationLabel,
      hours: state.hours,
      totalPrice: state.price,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      status: 'PENDING', // Using string literal
      createdAt: new Date().toISOString(), 
      utr: utr,
      customerId: currentUser?.id,
      customerName: currentUser?.name
    };
    await StorageService.createBooking(booking);

    // 2. Construct WhatsApp Message
    const timeString = state.startMode === 'later' 
      ? startDateTime.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : "Immediate";

    const message = `
*PAYMENT SUBMITTED*
---------------------
*Order ID:* ${orderId}
*Valorant ID:* ${state.account.name}
*Duration:* ${state.durationLabel}
*Price:* ₹${state.price}
*Start Time:* ${timeString}
*UTR/Ref ID:* ${utr}
---------------------
I have made the payment. Please verify.
    `.trim();

    // 3. Redirect to WhatsApp (Open in new tab to avoid iframe/preview blocks)
    const whatsappUrl = `https://wa.me/919860185116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // 4. Redirect user to Dashboard to track status
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm">
        <span onClick={() => navigate('/browse')} className="cursor-pointer hover:text-white">Browse</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-white">Checkout</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Column: Payment Details */}
        <div className="space-y-6">
          <div className="bg-brand-surface border border-white/10 rounded-xl p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 blur-3xl rounded-full pointer-events-none"></div>

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-sm">1</span>
              Make Payment
            </h2>
            
            {/* Mobile: Pay Button - Changed to Anchor tag for better deep linking support */}
            <div className="md:hidden mb-6">
              <a 
                href={upiString}
                className="w-full bg-white text-brand-darker font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors animate-pulse no-underline"
              >
                <Smartphone className="w-6 h-6" />
                Tap to Pay via UPI App
              </a>
              <p className="text-center text-xs text-slate-400 mt-2">Opens GPay, PhonePe, Paytm, etc.</p>
            </div>

            {/* Desktop/QR Display */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg mb-4 shadow-inner relative group">
              <img 
                src={qrCodeUrl} 
                alt="UPI QR Code" 
                className="w-48 h-48 mb-2 mix-blend-multiply"
              />
              <p className="text-brand-dark font-bold text-lg">₹{state.price}</p>
              
              {/* Scan Overlay for visual flair */}
              <div className="absolute inset-0 bg-brand-accent/5 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent/50 animate-[scan_2s_infinite_linear] pointer-events-none" />
            </div>

            <div className="flex items-center justify-between bg-brand-dark p-3 rounded border border-white/10">
              <span className="text-sm text-slate-400">UPI ID:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{UPI_ID}</span>
                <button 
                   onClick={() => navigator.clipboard.writeText(UPI_ID)}
                   className="text-brand-accent hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-300 flex items-start gap-2">
               <ShieldCheck className="w-5 h-5 shrink-0" />
               <p>
                 Scan QR code to pay. After payment, enter the <strong>12-digit UTR/Reference ID</strong> below to verify.
               </p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="flex gap-4 mb-6 pb-6 border-b border-white/10">
              <img src={state.account.imageUrl} className="w-20 h-20 rounded object-cover" alt="" />
              <div>
                <h3 className="font-bold text-lg">{state.account.name}</h3>
                <span className="text-sm text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded border border-brand-secondary/20">
                  {state.account.rank}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-300">
                <span>Order ID</span>
                <span className="font-mono text-white">{orderId}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Duration</span>
                <span className="text-white">{state.durationLabel}</span>
              </div>
              
              {/* Scheduled Time Display */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/5 mt-2">
                <div className="flex items-start gap-2 mb-2">
                  <CalendarClock className="w-4 h-4 text-brand-accent mt-0.5" />
                  <span className="text-sm font-bold text-white">Rental Schedule</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Start:</span>
                  <span className="text-white font-mono">
                    {state.startMode === 'now' 
                      ? 'Immediate' 
                      : startDateTime.toLocaleString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                   <span className="text-slate-400">End:</span>
                   <span className="text-white font-mono">
                     {endDateTime.toLocaleString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                   </span>
                </div>
              </div>

              <div className="flex justify-between text-slate-300 pt-2">
                <span>Subtotal</span>
                <span className={state.originalPrice ? 'line-through text-slate-500 text-sm' : 'text-white'}>
                   ₹{state.originalPrice || state.price}
                </span>
              </div>
              
              {state.originalPrice && (
                 <div className="flex justify-between text-brand-accent font-medium text-sm">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 fill-current" /> Discount (24h Offer)</span>
                    <span>-₹{(state.originalPrice - state.price).toFixed(0)}</span>
                 </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10 mb-6">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-2xl text-brand-accent">₹{state.price}</span>
            </div>

            {/* UTR Verification Section */}
            <div className="pt-2">
                <label className="block text-sm font-bold text-white mb-2">
                   Enter Payment UTR / Reference ID
                </label>
                <input 
                  type="text" 
                  value={utr}
                  onChange={(e) => {
                    setUtr(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. 3245xxxxxxxx"
                  className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent focus:outline-none mb-2 font-mono"
                />
                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                <button 
                  onClick={handleSubmitPayment}
                  className="w-full bg-brand-accent hover:bg-red-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-accent/20"
                >
                  <Send className="w-5 h-5" />
                  Submit & Verify on WhatsApp
                </button>
                <p className="text-xs text-center mt-3 text-slate-500">
                  Clicking submit will redirect you to WhatsApp to complete your booking.
                </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
