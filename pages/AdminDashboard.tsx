
import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { AIService } from '../services/ai';
import { Account, Booking, BookingStatus, Rank, User, HomeConfig, Review, Skin, HeroSlide, TrustItem, StepItem, Coupon, PaymentConfig } from '../types';
import { Plus, Trash2, Check, X, Edit2, Loader2, LogOut, Square, CheckSquare, BarChart3, Activity, IndianRupee, Users, Gamepad2, Home, Save, Zap, Shield, Star, MessageSquare, AlertCircle, Cpu, Search, Video, FileText, Play, Copy, Terminal, Layout, Image as ImageIcon, ShieldCheck, Lock, Ban, Type as TypeIcon, Clock, Ticket, CalendarDays, Repeat, Building, CreditCard, QrCode, Upload, RotateCcw, Calendar, Flame } from 'lucide-react';
import AdminAnalyticsTab from '../components/AdminAnalyticsTab';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'analytics' | 'accounts' | 'user_listings' | 'users' | 'edithome' | 'coupons' | 'payment'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [loading, setLoading] = useState(true);
  
  const [configSaved, setConfigSaved] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Local Editor states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '', 
    rank: Rank.IRON, 
    skins: [], 
    pricing: { hours1: 80, hours3: 49, hours12: 149, hours24: 249 }, // Default hours1: 80
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    username: '',
    password: '',
    description: 'Premium Valorant Account with verified skins.',
    initialSkinsCount: 10
  });

  // Coupon State
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    type: 'PERCENT' | 'FLAT';
    value: number;
    active: boolean;
    expiryDate: string;
    usageType: 'UNLIMITED' | 'LIMITED';
    maxUses: number;
  }>({
    code: '',
    type: 'PERCENT',
    value: 10,
    active: true,
    expiryDate: '',
    usageType: 'UNLIMITED',
    maxUses: 1
  });

  const [bulkRate, setBulkRate] = useState<number>(80);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const handleBulkUpdateHours1 = async () => {
    if (isNaN(bulkRate) || bulkRate <= 0) {
      alert("Please enter a valid rate greater than 0");
      return;
    }
    if (!window.confirm(`Are you sure you want to set the 1-hour rate for ALL accounts to ₹${bulkRate}/hr?`)) {
      return;
    }
    setIsBulkUpdating(true);
    try {
      await StorageService.bulkUpdateHours1Rate(bulkRate);
      await refreshData();
      alert(`Successfully updated 1-hour rate to ₹${bulkRate}/hr for all accounts!`);
    } catch (err: any) {
      alert(`Bulk update failed: ${err.message || err}`);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const [updatingTrendingId, setUpdatingTrendingId] = useState<string | null>(null);

  const handleToggleTrending = async (acc: Account) => {
    setUpdatingTrendingId(acc.id);
    try {
      const updatedAccount: Account = {
        ...acc,
        isTrending: !acc.isTrending
      };
      await StorageService.saveAccount(updatedAccount);
      setAccounts(prev => prev.map(a => a.id === acc.id ? updatedAccount : a));
    } catch (err: any) {
      alert("Failed to update trending status: " + (err?.message || 'Error'));
    } finally {
      setUpdatingTrendingId(null);
    }
  };

  const refreshData = async () => {
    try {
      const [b, a, u, h] = await Promise.all([
        StorageService.getBookings(),
        StorageService.getAccounts(),
        StorageService.getAllUsers(),
        StorageService.getHomeConfig()
      ]);
      setBookings(b);
      setAccounts(a);
      setUsers(u);
      setHomeConfig(h);
    } catch (err) {
        console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      const unsubscribe = StorageService.subscribe(refreshData);
      const interval = setInterval(refreshData, 30000);
      window.addEventListener('storage', refreshData);
      return () => {
        unsubscribe();
        clearInterval(interval);
        window.removeEventListener('storage', refreshData);
      };
    }
  }, [isAuthenticated]);

  // Timeframe state
  const [timeframe, setTimeframe] = useState<'all' | 'weekly' | 'monthly'>('all');
  
  // Database-synced baseline from Supabase home_config
  const baselineDate = homeConfig.statsBaselineTimestamp ?? null;

  const handleResetBaseline = async () => {
    if (window.confirm("Reset earnings, bookings, and user counters to ZERO starting from now?\n\nThis will sync with your Supabase database across all devices. Existing booking records will stay safely in the database, but counters will start from ₹0.")) {
      const nowTimestamp = Date.now();
      const updatedConfig: HomeConfig = {
        ...homeConfig,
        statsBaselineTimestamp: nowTimestamp
      };
      setHomeConfig(updatedConfig);
      try {
        await StorageService.saveHomeConfig(updatedConfig);
        await refreshData();
      } catch (err: any) {
        alert("Failed to sync reset with database: " + (err.message || err));
      }
    }
  };

  const handleRestoreBaseline = async () => {
    const updatedConfig: HomeConfig = {
      ...homeConfig,
      statsBaselineTimestamp: null
    };
    setHomeConfig(updatedConfig);
    try {
      await StorageService.saveHomeConfig(updatedConfig);
      await refreshData();
    } catch (err: any) {
      alert("Failed to restore history in database: " + (err.message || err));
    }
  };

  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgoMs = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoMs = now - (30 * 24 * 60 * 60 * 1000);

    // Filter by baseline if admin reset counter
    const validBookings = baselineDate 
      ? bookings.filter(b => new Date(b.createdAt || b.startTime).getTime() >= baselineDate)
      : bookings;

    const paidBookings = validBookings.filter(b => 
      b.status === BookingStatus.ACTIVE || 
      b.status === BookingStatus.COMPLETED || 
      b.status === BookingStatus.PRE_BOOKED
    );

    // Earnings
    const allTimeRevenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const monthlyRevenue = paidBookings
      .filter(b => new Date(b.createdAt || b.startTime).getTime() >= thirtyDaysAgoMs)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const weeklyRevenue = paidBookings
      .filter(b => new Date(b.createdAt || b.startTime).getTime() >= sevenDaysAgoMs)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Bookings
    const allTimeBookings = validBookings.length;
    const monthlyBookings = validBookings
      .filter(b => new Date(b.createdAt || b.startTime).getTime() >= thirtyDaysAgoMs).length;
    const weeklyBookings = validBookings
      .filter(b => new Date(b.createdAt || b.startTime).getTime() >= sevenDaysAgoMs).length;

    // Users
    const validUsers = baselineDate
      ? users.filter(u => new Date(u.createdAt).getTime() >= baselineDate)
      : users;
    const totalUsers = validUsers.length;
    const monthlyUsers = validUsers
      .filter(u => new Date(u.createdAt).getTime() >= thirtyDaysAgoMs).length;
    const weeklyUsers = validUsers
      .filter(u => new Date(u.createdAt).getTime() >= sevenDaysAgoMs).length;

    // Active Fleet
    const activeRentals = accounts.filter(a => a.isBooked).length;
    const preBookedRentals = validBookings.filter(b => b.status === BookingStatus.PRE_BOOKED).length;

    return {
      allTimeRevenue,
      monthlyRevenue,
      weeklyRevenue,
      allTimeBookings,
      monthlyBookings,
      weeklyBookings,
      totalUsers,
      monthlyUsers,
      weeklyUsers,
      activeRentals,
      preBookedRentals
    };
  }, [bookings, accounts, users, baselineDate]);

  const currentRevenue = 
    timeframe === 'weekly' ? stats.weeklyRevenue :
    timeframe === 'monthly' ? stats.monthlyRevenue :
    stats.allTimeRevenue;

  const currentBookings = 
    timeframe === 'weekly' ? stats.weeklyBookings :
    timeframe === 'monthly' ? stats.monthlyBookings :
    stats.allTimeBookings;

  const currentUsers = 
    timeframe === 'weekly' ? stats.weeklyUsers :
    timeframe === 'monthly' ? stats.monthlyUsers :
    stats.totalUsers;

  const timeframeLabel = 
    timeframe === 'weekly' ? 'Weekly' :
    timeframe === 'monthly' ? 'Monthly' :
    'All-Time';

  const handleDeployAccount = async () => {
    if (!newAccount.name || !newAccount.username || !newAccount.password) {
      alert("Missing required fields: Name, Username, or Password");
      return;
    }

    const accountToSave: Account = {
      id: 'ACC-' + Date.now(),
      name: newAccount.name!,
      rank: newAccount.rank as Rank,
      skins: newAccount.skins || [],
      description: newAccount.description,
      pricing: newAccount.pricing as any,
      imageUrl: newAccount.imageUrl!,
      isBooked: false,
      bookedUntil: null,
      username: newAccount.username,
      password: newAccount.password,
      initialSkinsCount: newAccount.initialSkinsCount || 10
    };

    setLoading(true);
    try {
      await StorageService.saveAccount(accountToSave);
      setShowAddModal(false);
      setNewAccount({
        name: '', rank: Rank.IRON, skins: [], pricing: { hours1: 80, hours3: 49, hours12: 149, hours24: 249 },
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
        username: '', password: '', description: 'Premium Valorant Account.', initialSkinsCount: 10
      });
      await refreshData();
    } catch (err) {
      alert("Deployment failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async () => {
     if (!newCoupon.code || !newCoupon.value) {
        alert("Enter Code and Value");
        return;
     }

     const coupon: Coupon = {
        code: newCoupon.code.toUpperCase().trim(),
        type: newCoupon.type as 'PERCENT' | 'FLAT',
        value: Number(newCoupon.value),
        active: true,
        expiryDate: newCoupon.expiryDate ? newCoupon.expiryDate : null,
        maxUses: newCoupon.usageType === 'LIMITED' ? Number(newCoupon.maxUses) : null,
        currentUses: 0
     };

     const updatedConfig = { 
        ...homeConfig, 
        coupons: [...(homeConfig.coupons || []), coupon] 
     };

     setIsSavingConfig(true);
     await StorageService.saveHomeConfig(updatedConfig);
     setIsSavingConfig(false);
     setNewCoupon({ code: '', type: 'PERCENT', value: 10, active: true, expiryDate: '', usageType: 'UNLIMITED', maxUses: 1 });
     refreshData();
  };

  const handleDeleteCoupon = async (code: string) => {
     if(!window.confirm(`Delete coupon ${code}?`)) return;
     const updatedConfig = {
        ...homeConfig,
        coupons: (homeConfig.coupons || []).filter(c => c.code !== code)
     };
     setIsSavingConfig(true);
     await StorageService.saveHomeConfig(updatedConfig);
     setIsSavingConfig(false);
     refreshData();
  };

  // --- Home Config Editors ---

  const updateHeroSlide = (index: number, field: keyof HeroSlide, value: string) => {
    if (!homeConfig.heroSlides) return;
    const newSlides = [...homeConfig.heroSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setHomeConfig({ ...homeConfig, heroSlides: newSlides });
  };

  const updateReview = (index: number, field: keyof Review, value: string) => {
    if (!homeConfig.reviews) return;
    const newReviews = [...homeConfig.reviews];
    newReviews[index] = { ...newReviews[index], [field]: value };
    setHomeConfig({ ...homeConfig, reviews: newReviews });
  };

  const addReview = () => {
    const newReview: Review = {
        id: Date.now(),
        type: 'video',
        name: 'New Agent',
        rank: 'Unranked',
        quote: 'Gameplay footage.',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
        videoUrl: ''
    };
    setHomeConfig(prev => ({
        ...prev,
        reviews: [...(prev.reviews || []), newReview]
    }));
  };

  const deleteReview = (index: number) => {
    if(!window.confirm("Remove this video?")) return;
    setHomeConfig(prev => ({
        ...prev,
        reviews: (prev.reviews || []).filter((_, i) => i !== index)
    }));
  };

  const updateCTA = (field: string, value: string) => {
     setHomeConfig(prev => ({
        ...prev,
        cta: {
           ...prev.cta!,
           [field]: value
        }
     }));
  };
  const updatePaymentField = (field: keyof PaymentConfig, value: any) => {
    setHomeConfig(prev => ({
      ...prev,
      payment: {
        companyName: prev.payment?.companyName || 'Krishna Valo Store',
        upiId: prev.payment?.upiId || '8530085116@fam',
        qrCodeUrl: prev.payment?.qrCodeUrl || '',
        razorpayEnabled: prev.payment?.razorpayEnabled !== false,
        razorpayKeyId: prev.payment?.razorpayKeyId || 'rzp_live_Td1pJL2txvaNnH',
        razorpayKeySecret: prev.payment?.razorpayKeySecret || 'vDX8p9Qqj6f5cI6NtPqbESEV',
        [field]: value
      }
    }));
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image is too large. Please select an image under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updatePaymentField('qrCodeUrl', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveGlobalConfig = async () => {
    setIsSavingConfig(true);
    try {
        await StorageService.saveHomeConfig(homeConfig);
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
    } catch (err) {
        alert("Failed to save configuration. Check console.");
    } finally {
        setIsSavingConfig(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/admin" />;
  if (loading && !showAddModal) return <div className="min-h-screen flex items-center justify-center bg-brand-darker"><Loader2 className="w-10 h-10 text-brand-accent animate-spin" /></div>;

  const previewUpiId = homeConfig.payment?.upiId || '8530085116@fam';
  const previewCompany = homeConfig.payment?.companyName || 'Krishna Valo Store';
  const previewQrUrl = homeConfig.payment?.qrCodeUrl?.trim() 
    ? homeConfig.payment.qrCodeUrl 
    : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(`upi://pay?pa=${previewUpiId}&pn=${encodeURIComponent(previewCompany)}&am=100.00&cu=INR`)}`;

  // Enhance bookings with listing info
  const enhancedBookings = bookings.map(b => {
     const acc = accounts.find(a => a.id === b.accountId);
     return {
        ...b,
        listingType: acc?.listedBy ? 'USER' : 'PLATFORM',
        listerName: acc?.listedByName || 'Admin'
     };
  });

  return (
    <div className="min-h-screen bg-brand-darker text-white p-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-black tracking-wider uppercase italic">Mission Control</h1>
              <span className="px-2 py-0.5 rounded bg-brand-accent/20 border border-brand-accent/30 text-brand-accent text-[10px] font-mono font-bold">ADMIN</span>
           </div>
           <p className="text-slate-400 text-xs font-mono mt-1">SECURE TERMINAL // VANGUARD PROTOCOL ACTIVE</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <Link to="/" className="p-2.5 bg-brand-surface border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all flex-1 md:flex-none justify-center flex"><Home size={20} /></Link>
           <button onClick={() => { localStorage.removeItem('isAdmin'); sessionStorage.removeItem('isAdmin'); navigate('/admin'); }} className="p-2.5 bg-brand-surface border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 transition-all flex-1 md:flex-none justify-center flex"><LogOut size={20} /></button>
        </div>
      </div>

      {/* Tracking Window & Reset Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 bg-brand-surface border border-white/10 rounded-xl p-3 shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1.5 mr-1">
            <Calendar size={13} className="text-brand-cyan" />
            <span>Tracking Window:</span>
          </span>

          {/* Reset Button */}
          <button
            onClick={() => setTimeframe('all')}
            title="Reset timeframe filter to All-Time"
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              timeframe !== 'all'
                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 cursor-pointer shadow-sm'
                : 'bg-white/5 text-slate-400 border-white/10 opacity-70 hover:opacity-100 cursor-pointer'
            }`}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center bg-brand-darker border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                timeframe === 'weekly'
                  ? 'bg-brand-accent text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly (7d)
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                timeframe === 'monthly'
                  ? 'bg-brand-accent text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly (30d)
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                timeframe === 'all'
                  ? 'bg-brand-accent text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Counter Baseline Controls */}
        <div className="flex items-center gap-2">
          {baselineDate ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded">
                Counter Reset Active ({new Date(baselineDate).toLocaleDateString()})
              </span>
              <button
                onClick={handleRestoreBaseline}
                className="text-[10px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
              >
                Restore History
              </button>
            </div>
          ) : (
            <button
              onClick={handleResetBaseline}
              className="text-[10px] font-mono text-slate-500 hover:text-red-400 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded border border-white/5 hover:border-red-500/20 hover:bg-red-500/5 cursor-pointer"
              title="Reset earnings and bookings counter to ₹0 starting fresh from now"
            >
              <RotateCcw size={11} />
              <span>Reset Counter to ₹0</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label={timeframe === 'all' ? 'Total Earnings' : `${timeframeLabel} Earnings`} 
          value={`₹${currentRevenue.toLocaleString('en-IN')}`} 
          icon={IndianRupee} 
          color="text-emerald-400" 
          badge={timeframeLabel}
          breakdowns={[
            { label: 'Weekly', value: `₹${stats.weeklyRevenue.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
            { label: 'Monthly', value: `₹${stats.monthlyRevenue.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
            { label: 'All-Time', value: `₹${stats.allTimeRevenue.toLocaleString('en-IN')}`, color: 'text-white' }
          ]}
        />
        <StatCard 
          label={timeframe === 'all' ? 'Total Bookings' : `${timeframeLabel} Bookings`} 
          value={currentBookings.toString()} 
          icon={BarChart3} 
          color="text-blue-400" 
          badge={timeframeLabel}
          breakdowns={[
            { label: 'Weekly', value: stats.weeklyBookings.toString(), color: 'text-blue-400' },
            { label: 'Monthly', value: stats.monthlyBookings.toString(), color: 'text-blue-400' },
            { label: 'All-Time', value: stats.allTimeBookings.toString(), color: 'text-white' }
          ]}
        />
        <StatCard 
          label="Active Rentals" 
          value={stats.activeRentals.toString()} 
          icon={Gamepad2} 
          color="text-brand-accent" 
          badge="Live"
          breakdowns={[
            { label: 'Live Playing', value: `${stats.activeRentals} IDs`, color: 'text-brand-accent' },
            { label: 'Queued', value: `${stats.preBookedRentals} Pre`, color: 'text-purple-400' },
            { label: 'Total Fleet', value: `${accounts.length} IDs`, color: 'text-slate-300' }
          ]}
        />
        <StatCard 
          label={timeframe === 'all' ? 'Total Users' : `${timeframeLabel} Users`} 
          value={currentUsers.toString()} 
          icon={Users} 
          color="text-purple-400" 
          badge={timeframeLabel}
          breakdowns={[
            { label: 'Weekly', value: `+${stats.weeklyUsers}`, color: 'text-purple-400' },
            { label: 'Monthly', value: `+${stats.monthlyUsers}`, color: 'text-purple-400' },
            { label: 'All-Time', value: stats.totalUsers.toString(), color: 'text-white' }
          ]}
        />
      </div>

      {/* Mobile Responsive Tabs - Scrollable */}
      <div className="flex bg-brand-dark p-1 rounded-lg border border-white/10 w-full md:w-fit mb-8 overflow-x-auto shadow-2xl no-scrollbar">
        {[
          { id: 'bookings', icon: BarChart3, label: 'Bookings' },
          { id: 'analytics', icon: Activity, label: 'Intelligence & Traffic' },
          { id: 'accounts', icon: Gamepad2, label: 'Platform IDs' },
          { id: 'user_listings', icon: Users, label: 'User IDs' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'coupons', icon: Ticket, label: 'Coupons' },
          { id: 'edithome', icon: Layout, label: 'Edit Home' },
          { id: 'payment', icon: QrCode, label: 'Payment Settings' }
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-shrink-0 px-6 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'bookings' && <BookingTable bookings={enhancedBookings} onUpdateStatus={async (id: string, s: BookingStatus) => { try { await StorageService.updateBookingStatus(id, s); refreshData(); } catch(e: any) { alert(e.message); } }} onDelete={async (id: string) => { await StorageService.deleteBooking(id); refreshData(); }} />}
      
      {activeTab === 'analytics' && <AdminAnalyticsTab accounts={accounts} bookings={bookings} />}

      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Bulk Pricing Management Card */}
          <div className="bg-brand-surface border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-cyan" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Bulk 1-Hour Rate Management</h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Quickly set the 1-hour rate across all inventory accounts simultaneously</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-mono text-slate-400 whitespace-nowrap">1h Rate: ₹</span>
              <input
                type="number"
                value={bulkRate}
                onChange={(e) => setBulkRate(Number(e.target.value))}
                className="w-24 bg-brand-dark border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:border-brand-accent outline-none"
              />
              <button
                disabled={isBulkUpdating}
                onClick={handleBulkUpdateHours1}
                className="px-4 py-2 bg-brand-accent hover:bg-red-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-brand-accent/20 flex items-center gap-1.5 whitespace-nowrap"
              >
                {isBulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Set All IDs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button 
              onClick={() => setShowAddModal(true)} 
              className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:border-brand-accent hover:bg-white/5 transition-all group w-full text-left"
            >
              <Plus className="w-10 h-10 mb-2 text-slate-600 group-hover:text-brand-accent group-hover:scale-110 transition-all" /> 
              <span className="font-bold text-slate-500 group-hover:text-white tracking-widest uppercase text-xs">Deploy New Agent</span>
            </button>
            {accounts.filter(a => !a.listedBy).map(acc => (
              <div key={acc.id} className="bg-brand-surface border border-white/10 rounded-xl p-5 flex justify-between items-center group hover:border-brand-accent/50 transition-all shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-white/5 relative">
                        <img src={acc.imageUrl} className="w-full h-full object-cover" alt="" />
                        {acc.isTrending && (
                          <div className="absolute top-0.5 right-0.5 bg-amber-500 rounded-full p-0.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                            <Flame size={10} className="fill-black text-black" />
                          </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm uppercase tracking-tight">{acc.name}</span>
                          {acc.isTrending && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-bold font-mono uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                              <Flame size={10} className="fill-amber-400 text-amber-400" /> Trending
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{acc.rank} // {acc.id}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleTrending(acc)}
                    disabled={updatingTrendingId === acc.id}
                    className={`p-2.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-bold ${
                      acc.isTrending 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
                        : 'bg-brand-surface border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10'
                    }`}
                    title={acc.isTrending ? "Click to remove Trending tag" : "Click to tag as Trending (Pins to top)"}
                  >
                    {updatingTrendingId === acc.id ? (
                      <Loader2 size={15} className="animate-spin text-amber-400" />
                    ) : (
                      <Flame size={15} className={acc.isTrending ? "fill-amber-400 text-amber-400" : ""} />
                    )}
                    <span className="hidden sm:inline">{acc.isTrending ? "Trending" : "Tag Trending"}</span>
                  </button>
                  <Link to={`/admin/edit/${acc.id}`} className="p-2.5 bg-brand-surface border border-white/10 text-slate-400 rounded-lg hover:bg-brand-cyan hover:text-brand-dark hover:border-brand-cyan transition-all"><Edit2 size={16} /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'user_listings' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.filter(a => a.listedBy).map(acc => (
               <div key={acc.id} className="bg-brand-surface border border-white/10 rounded-xl p-5 relative group hover:border-brand-accent/50 transition-all shadow-lg">
                  <div className="absolute top-3 right-3 bg-brand-dark/80 px-2 py-1 rounded text-[9px] font-bold uppercase text-slate-400 border border-white/10">
                     Listed by: {acc.listedByName || 'Unknown'}
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-white/5 relative">
                        <img src={acc.imageUrl} className="w-full h-full object-cover" alt="" />
                        {acc.isTrending && (
                          <div className="absolute top-0.5 right-0.5 bg-amber-500 rounded-full p-0.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                            <Flame size={10} className="fill-black text-black" />
                          </div>
                        )}
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm uppercase tracking-tight truncate w-32">{acc.name}</span>
                          {acc.isTrending && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-bold font-mono uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                              <Flame size={10} className="fill-amber-400 text-amber-400" /> Trending
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{acc.rank}</div>
                     </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                     <div className={`text-[10px] font-bold uppercase ${acc.isBooked ? 'text-red-400' : 'text-green-400'}`}>
                        {acc.isBooked ? 'Occupied' : 'Active'}
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTrending(acc)}
                          disabled={updatingTrendingId === acc.id}
                          className={`p-2 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-bold ${
                            acc.isTrending 
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]' 
                              : 'bg-brand-surface border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
                          }`}
                          title={acc.isTrending ? "Click to remove Trending tag" : "Click to tag as Trending"}
                        >
                          {updatingTrendingId === acc.id ? (
                            <Loader2 size={13} className="animate-spin text-amber-400" />
                          ) : (
                            <Flame size={13} className={acc.isTrending ? "fill-amber-400 text-amber-400" : ""} />
                          )}
                          <span className="hidden sm:inline">{acc.isTrending ? "Trending" : "Tag"}</span>
                        </button>
                        <Link to={`/admin/edit/${acc.id}`} className="p-2 bg-brand-surface border border-white/10 text-slate-400 rounded-lg hover:bg-brand-cyan hover:text-brand-dark transition-all">
                           <Edit2 size={14} />
                        </Link>
                     </div>
                  </div>
               </div>
            ))}
            {accounts.filter(a => a.listedBy).length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-500 italic">No user-listed IDs found.</div>
            )}
         </div>
      )}

      {activeTab === 'coupons' && (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* ... Coupon Editor Logic (Same as before) ... */}
             <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-brand-cyan" /> Generate New Code
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Coupon Code</label>
                        <input 
                           type="text" 
                           placeholder="e.g. SUMMER50" 
                           value={newCoupon.code}
                           onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                           className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-brand-cyan font-mono"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                        <select 
                           value={newCoupon.type}
                           onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value as 'PERCENT' | 'FLAT'})}
                           className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-brand-cyan cursor-pointer"
                        >
                           <option value="PERCENT">Percentage (%)</option>
                           <option value="FLAT">Flat Amount (₹)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Value</label>
                        <input 
                           type="number" 
                           value={newCoupon.value}
                           onChange={(e) => setNewCoupon({...newCoupon, value: parseInt(e.target.value) || 0})}
                           className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-brand-cyan"
                        />
                     </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><CalendarDays size={12}/> Expiry Date (Optional)</label>
                        <input 
                           type="date" 
                           value={newCoupon.expiryDate}
                           onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                           className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-brand-cyan uppercase text-xs"
                        />
                     </div>
                     <div className="flex gap-4">
                         <div className="flex-1">
                             <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Usage Limit</label>
                             <select 
                               value={newCoupon.usageType}
                               onChange={(e) => setNewCoupon({...newCoupon, usageType: e.target.value as 'UNLIMITED' | 'LIMITED', maxUses: e.target.value === 'LIMITED' ? 1 : 1})}
                               className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-brand-cyan cursor-pointer text-xs"
                             >
                                <option value="UNLIMITED">Unlimited</option>
                                <option value="LIMITED">Fixed Amount</option>
                             </select>
                         </div>
                         {newCoupon.usageType === 'LIMITED' && (
                             <div className="w-24 animate-in fade-in slide-in-from-left-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Uses</label>
                                <input 
                                   type="number" 
                                   min="1"
                                   value={newCoupon.maxUses}
                                   onChange={(e) => setNewCoupon({...newCoupon, maxUses: parseInt(e.target.value) || 1})}
                                   className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-brand-cyan text-center"
                                />
                             </div>
                         )}
                     </div>
                     <button 
                        onClick={handleAddCoupon}
                        disabled={isSavingConfig}
                        className="w-full md:w-auto px-6 py-2.5 bg-brand-cyan hover:bg-white text-brand-dark font-bold rounded-lg transition-all uppercase tracking-wide text-xs flex items-center justify-center gap-2"
                     >
                        {isSavingConfig ? <Loader2 className="animate-spin w-4 h-4" /> : 'Create Coupon'}
                     </button>
                 </div>
             </div>
             <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                   <thead>
                      <tr className="bg-brand-darker text-slate-500 border-b border-white/10 uppercase font-bold tracking-widest text-[10px]">
                         <th className="p-5">Code</th>
                         <th className="p-5">Discount</th>
                         <th className="p-5">Expiry</th>
                         <th className="p-5">Usage</th>
                         <th className="p-5 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {(homeConfig.coupons || []).map((coupon, idx) => (
                         <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-5 font-mono font-bold text-white">{coupon.code}</td>
                            <td className="p-5 text-brand-cyan">
                               {coupon.type === 'PERCENT' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT OFF`}
                            </td>
                            <td className="p-5 text-xs text-slate-400">
                               {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No Expiry'}
                            </td>
                            <td className="p-5">
                               <div className="flex items-center gap-2 text-xs">
                                  <Repeat size={12} className="text-slate-500"/>
                                  <span className={coupon.maxUses && coupon.currentUses >= coupon.maxUses ? 'text-red-400 font-bold' : 'text-slate-300'}>
                                     {coupon.currentUses} / {coupon.maxUses ? coupon.maxUses : '∞'}
                                  </span>
                               </div>
                            </td>
                            <td className="p-5 text-right">
                               <button 
                                  onClick={() => handleDeleteCoupon(coupon.code)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Delete Coupon"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
         </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead>
              <tr className="bg-brand-darker text-slate-500 border-b border-white/10 uppercase font-bold tracking-widest text-[10px]">
                <th className="p-5">Agent</th>
                <th className="p-5">Contact</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <img src={user.avatarUrl} className="w-8 h-8 rounded-full bg-brand-accent/20" alt="" />
                      <div>
                        <div className="text-white font-bold">{user.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{user.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="text-slate-300">{user.email}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{user.phone}</div>
                  </td>
                  <td className="p-5 text-right">
                     <div className="flex justify-end gap-2 items-center">
                        <button onClick={async () => { if(window.confirm(`ELIMINATE AGENT ${user.name}? This action is irreversible.`)) { await StorageService.deleteUser(user.id); refreshData(); }}} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded border border-red-500/20 transition-all shadow-[0_0_10px_rgba(220,38,38,0.2)]" title="Delete User"><Trash2 size={14} /></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'edithome' && (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sticky Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-brand-surface p-5 border border-white/10 rounded-xl sticky top-4 z-40 backdrop-blur-xl shadow-2xl gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 rounded-lg bg-brand-accent/20 text-brand-accent"><Layout size={20} /></div>
                 <div>
                    <h2 className="font-bold text-white uppercase tracking-widest text-sm">Storefront Architect</h2>
                    <p className="text-[10px] text-slate-500 font-mono">ALL DEVICE SYNC ENABLED</p>
                 </div>
              </div>
              <button onClick={saveGlobalConfig} disabled={isSavingConfig} className={`w-full md:w-auto px-10 py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-white shadow-xl transition-all uppercase tracking-widest text-xs ${configSaved ? 'bg-green-600' : 'bg-brand-accent hover:bg-red-600 active:scale-95 disabled:opacity-50'}`}>
                {isSavingConfig ? <Loader2 className="animate-spin" size={16} /> : configSaved ? <Check size={16} /> : <Save size={16} />} 
                {configSaved ? 'DEPLOYED SUCCESSFULLY' : isSavingConfig ? 'UPLOADING...' : 'SAVE ALL CHANGES'}
              </button>
            </div>
            
            {/* Hero Section Editor */}
            <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Layout size={20} className="text-brand-accent" /> Hero Carousel
                </h3>
                <div className="space-y-6">
                    {homeConfig.heroSlides?.map((slide, idx) => (
                        <div key={slide.id} className="p-4 bg-brand-dark border border-white/5 rounded-lg space-y-4">
                            <div className="flex justify-between items-center text-xs uppercase font-bold text-slate-500">
                                <span>Slide {idx + 1}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Title</label>
                                    <input type="text" value={slide.title} onChange={e => updateHeroSlide(idx, 'title', e.target.value)} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Subtitle</label>
                                    <input type="text" value={slide.subtitle} onChange={e => updateHeroSlide(idx, 'subtitle', e.target.value)} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Image URL</label>
                                    <div className="flex gap-4">
                                        <div className="w-16 h-10 bg-black rounded overflow-hidden shrink-0 border border-white/10">
                                            <img src={slide.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <input type="text" value={slide.image} onChange={e => updateHeroSlide(idx, 'image', e.target.value)} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-cyan text-xs font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Community Intel (Reviews) Editor */}
            <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Video size={20} className="text-brand-cyan" /> Community Intel (Videos)
                    </h3>
                    <button onClick={addReview} className="px-3 py-1.5 bg-brand-cyan/10 hover:bg-brand-cyan hover:text-brand-dark text-brand-cyan text-xs font-bold rounded flex items-center gap-2 transition-colors uppercase tracking-wide">
                        <Plus size={14} /> Add Video
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    {homeConfig.reviews?.map((review, idx) => {
                       if(review.type !== 'video') return null;
                       return (
                        <div key={review.id} className="p-4 bg-brand-dark border border-white/5 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 relative group">
                             <div className="absolute top-2 right-2 flex items-center gap-2">
                                <span className="text-[10px] text-slate-600 font-mono">ID: {review.id}</span>
                                <button onClick={() => deleteReview(idx)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Remove Video">
                                   <Trash2 size={14} />
                                </button>
                             </div>
                             <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Player Name</label>
                                <input type="text" value={review.name} onChange={e => updateReview(idx, 'name', e.target.value)} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" />
                             </div>
                             <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rank</label>
                                <input type="text" value={review.rank} onChange={e => updateReview(idx, 'rank', e.target.value)} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" />
                             </div>
                             <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Thumbnail URL</label>
                                <div className="flex gap-3">
                                   <div className="w-10 h-10 bg-black rounded border border-white/10 overflow-hidden shrink-0">
                                      <img src={review.thumbnail} className="w-full h-full object-cover" alt=""/>
                                   </div>
                                   <input type="text" value={review.thumbnail} onChange={e => updateReview(idx, 'thumbnail', e.target.value)} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-cyan text-xs font-mono" />
                                </div>
                             </div>
                             <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Video URL (ScreenPal/Mp4)</label>
                                <input type="text" value={review.videoUrl} onChange={e => updateReview(idx, 'videoUrl', e.target.value)} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-cyan text-xs font-mono" />
                             </div>
                        </div>
                       );
                    })}
                </div>
            </div>
            
            {/* CTA Editor */}
            <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-500" /> Bottom CTA
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Title Line 1</label>
                        <input type="text" value={homeConfig.cta?.titleLine1} onChange={e => updateCTA('titleLine1', e.target.value)} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Title Line 2 (Gradient)</label>
                        <input type="text" value={homeConfig.cta?.titleLine2} onChange={e => updateCTA('titleLine2', e.target.value)} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Subtitle</label>
                         <textarea rows={2} value={homeConfig.cta?.subtitle} onChange={e => updateCTA('subtitle', e.target.value)} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm resize-none" />
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* Payment Settings Tab */}
      {activeTab === 'payment' && (
         <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-surface p-6 rounded-xl border border-white/10 shadow-2xl">
               <div>
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
                        <QrCode size={22} />
                     </div>
                     <h2 className="text-xl font-bold uppercase tracking-wider italic">Payment & Merchant Settings</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Configure company name, business UPI ID, and QR code for checkout payments.</p>
               </div>
               <button 
                 onClick={saveGlobalConfig} 
                 disabled={isSavingConfig}
                 className="flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-accent/20"
               >
                 {isSavingConfig ? <Loader2 size={16} className="animate-spin" /> : (configSaved ? <Check size={16} /> : <Save size={16} />)}
                 {configSaved ? "Settings Saved!" : "Save Payment Settings"}
               </button>
            </div>

            {/* Merchant Privacy & NPCI Info Banner */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
               <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
               <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-blue-400 font-bold uppercase tracking-wider block mb-1">How UPI Name Display Works:</span>
                  When customers make a UPI payment, banking apps (Google Pay, PhonePe, Paytm, BHIM) display the account holder's name registered with their bank/NPCI.
                  To ensure your <strong>Company Name</strong> is displayed:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                     <li>Enter your registered <strong className="text-white">Business / Merchant UPI ID</strong> (e.g., from PhonePe Business, Paytm for Business, or Google Pay for Business) below.</li>
                     <li>Or upload your official company <strong className="text-white">Merchant QR Code</strong> image below.</li>
                     <li>The Company Name you configure here will also be presented everywhere on the customer's checkout screen and payment links.</li>
                  </ul>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Column: Form Controls */}
               <div className="lg:col-span-2 space-y-6">
                  {/* Razorpay Gateway Card */}
                  <div className="bg-brand-surface p-6 rounded-xl border border-white/10 space-y-5 relative overflow-hidden">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                              <Zap size={20} />
                           </div>
                           <div>
                              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Razorpay Payment Gateway</h3>
                              <p className="text-[11px] text-slate-400">Instant customer payments via UPI, Cards, NetBanking, and Wallets</p>
                           </div>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <div 
                           onClick={() => updatePaymentField('razorpayEnabled', homeConfig.payment?.razorpayEnabled === false ? true : false)}
                           className="flex items-center gap-3 cursor-pointer select-none"
                        >
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {homeConfig.payment?.razorpayEnabled !== false ? 'Enabled' : 'Disabled'}
                           </span>
                           <div 
                              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                                 homeConfig.payment?.razorpayEnabled !== false ? 'bg-brand-accent' : 'bg-slate-700'
                              }`}
                           >
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                                 homeConfig.payment?.razorpayEnabled !== false ? 'left-7' : 'left-1'
                              }`} />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Razorpay Key ID (Public Client Key)
                           </label>
                           <input 
                              type="text" 
                              value={homeConfig.payment?.razorpayKeyId || ''} 
                              onChange={e => updatePaymentField('razorpayKeyId', e.target.value)} 
                              placeholder="rzp_live_Td1pJL2txvaNnH" 
                              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-brand-cyan font-mono text-xs focus:border-brand-accent outline-none"
                           />
                           <p className="text-[11px] text-slate-500 mt-1">
                              Used by the customer's browser to launch the Razorpay checkout modal.
                           </p>
                        </div>

                        <div>
                           <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Razorpay Key Secret (Private / Secure)
                           </label>
                           <input 
                              type="password" 
                              value={homeConfig.payment?.razorpayKeySecret || ''} 
                              onChange={e => updatePaymentField('razorpayKeySecret', e.target.value)} 
                              placeholder="••••••••••••••••••••••••" 
                              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-xs focus:border-brand-accent outline-none"
                           />
                           <p className="text-[11px] text-slate-500 mt-1">
                              Stored securely in your admin database.
                           </p>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between text-xs">
                           <span className="text-slate-400">Gateway Status:</span>
                           <span className="font-bold flex items-center gap-1.5 text-green-400">
                              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                              {homeConfig.payment?.razorpayEnabled !== false ? 'Live & Active on Checkout' : 'Gateway Disabled'}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Company Name */}
                  <div className="bg-brand-surface p-6 rounded-xl border border-white/10 space-y-4">
                     <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                        <Building className="text-brand-accent" size={18} />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Company / Business Display Name</h3>
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name on Checkout</label>
                        <input 
                           type="text" 
                           value={homeConfig.payment?.companyName || ''} 
                           onChange={e => updatePaymentField('companyName', e.target.value)} 
                           placeholder="e.g. Krishna Valo Store / Nexus Gaming" 
                           className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-brand-accent outline-none font-medium"
                        />
                        <p className="text-[11px] text-slate-500 mt-2">This name appears prominently on the customer checkout page, copy instructions, and payment references.</p>
                     </div>
                  </div>

                  {/* Merchant UPI ID */}
                  <div className="bg-brand-surface p-6 rounded-xl border border-white/10 space-y-4">
                     <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                        <CreditCard className="text-brand-accent" size={18} />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Merchant UPI ID (VPA)</h3>
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">UPI Virtual Payment Address</label>
                        <input 
                           type="text" 
                           value={homeConfig.payment?.upiId || ''} 
                           onChange={e => updatePaymentField('upiId', e.target.value)} 
                           placeholder="e.g. 8530085116@fam or merchant@bank" 
                           className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-brand-cyan font-mono text-sm focus:border-brand-cyan outline-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-2">All customer payments and dynamic QR codes will route to this UPI ID. Customers can also copy this ID with a single tap on checkout.</p>
                     </div>
                  </div>

                  {/* Custom Business QR Code */}
                  <div className="bg-brand-surface p-6 rounded-xl border border-white/10 space-y-4">
                     <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                           <QrCode className="text-brand-accent" size={18} />
                           <h3 className="text-sm font-bold text-white uppercase tracking-wider">Custom Merchant QR Code (Optional)</h3>
                        </div>
                        {homeConfig.payment?.qrCodeUrl && (
                           <button 
                              type="button"
                              onClick={() => updatePaymentField('qrCodeUrl', '')}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1"
                           >
                              <Trash2 size={12} /> Clear Custom QR
                           </button>
                        )}
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Direct Upload (Image File)</label>
                           <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-brand-accent/50 rounded-xl p-6 cursor-pointer bg-brand-dark/50 hover:bg-brand-dark transition-all group">
                              <Upload className="text-slate-500 group-hover:text-brand-accent mb-2 transition-colors" size={28} />
                              <span className="text-xs text-slate-300 font-bold">Click to upload Merchant QR image</span>
                              <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP up to 1MB</span>
                              <input type="file" accept="image/*" onChange={handleQrImageUpload} className="hidden" />
                           </label>
                        </div>

                        <div className="relative flex items-center justify-center my-2">
                           <div className="border-t border-white/10 w-full"></div>
                           <span className="bg-brand-surface px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 absolute">OR Enter Image URL</span>
                        </div>

                        <div>
                           <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">QR Code Image URL</label>
                           <input 
                              type="text" 
                              value={homeConfig.payment?.qrCodeUrl || ''} 
                              onChange={e => updatePaymentField('qrCodeUrl', e.target.value)} 
                              placeholder="https://your-domain.com/company-qr.png" 
                              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white text-xs font-mono focus:border-brand-accent outline-none"
                           />
                           <p className="text-[11px] text-slate-500 mt-2">
                              {homeConfig.payment?.qrCodeUrl 
                                 ? "✓ Custom QR code is active and will be displayed on the checkout screen."
                                 : "When empty, the system automatically generates dynamic UPI QR codes containing your configured UPI ID and company name."
                              }
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right Column: Live Checkout Preview */}
               <div className="space-y-4">
                  <div className="bg-brand-surface p-6 rounded-xl border border-white/10 space-y-4">
                     <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Customer Preview</h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${homeConfig.payment?.qrCodeUrl ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                           {homeConfig.payment?.qrCodeUrl ? 'Custom QR' : 'Dynamic QR'}
                        </span>
                     </div>

                     <div className="bg-brand-dark p-6 rounded-xl border border-white/5 flex flex-col items-center text-center space-y-4">
                        <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden">
                           <img 
                              src={previewQrUrl} 
                              alt="Payment QR Preview" 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                 (e.target as HTMLElement).style.display = 'none';
                              }}
                           />
                        </div>

                        <div>
                           <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest block">Payable To</span>
                           <h4 className="text-base font-bold text-white mt-0.5">{previewCompany}</h4>
                        </div>

                        <div className="w-full bg-brand-surface p-3 rounded-lg border border-white/5">
                           <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Merchant UPI ID</span>
                           <code className="text-xs text-brand-cyan font-mono font-bold break-all">{previewUpiId}</code>
                        </div>

                        <p className="text-[10px] text-slate-400 italic">
                           This is an exact preview of what your customers will see on the checkout screen.
                        </p>
                     </div>
                  </div>

                  <button 
                    onClick={saveGlobalConfig} 
                    disabled={isSavingConfig}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-brand-accent hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-accent/20"
                  >
                    {isSavingConfig ? <Loader2 size={16} className="animate-spin" /> : (configSaved ? <Check size={16} /> : <Save size={16} />)}
                    {configSaved ? "Settings Saved!" : "Save Payment Settings"}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           {/* ... Existing Modal Logic ... */}
           <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              <div className="p-6 border-b border-white/5 bg-brand-dark flex justify-between items-center"><div className="flex items-center gap-3"><ShieldCheck className="text-brand-cyan" size={24} /><h2 className="text-xl font-bold text-white uppercase tracking-tighter italic">Vanguard Agent Deployment</h2></div><button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button></div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <section className="space-y-4"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-4">Identity & Visuals</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Display Name</label><input type="text" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none" placeholder="e.g. Radiant Beast #IND" /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Rank</label><select value={newAccount.rank} onChange={e => setNewAccount({...newAccount, rank: e.target.value as Rank})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none cursor-pointer">{Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}</select></div></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hero Intelligence URL (Image)</label><input type="text" value={newAccount.imageUrl} onChange={e => setNewAccount({...newAccount, imageUrl: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-brand-cyan font-mono text-xs focus:border-brand-cyan outline-none" /></div><div className="pt-2"><label className="flex items-center gap-3 cursor-pointer select-none bg-brand-dark p-3 rounded-lg border border-white/10 hover:border-amber-500/40 transition-colors"><input type="checkbox" checked={!!newAccount.isTrending} onChange={e => setNewAccount({...newAccount, isTrending: e.target.checked})} className="w-4 h-4 rounded text-brand-accent focus:ring-0 bg-brand-surface border-white/20 cursor-pointer" /><span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5"><Flame size={14} className="fill-amber-400" /> Tag as Trending Account (Feature above others on site)</span></label></div></section>
                 <section className="space-y-4 bg-brand-accent/5 p-6 rounded-xl border border-brand-accent/20"><h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><Lock size={14} /> Secure Credentials</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Riot Username</label><input type="text" value={newAccount.username} onChange={e => setNewAccount({...newAccount, username: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none font-mono" /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Riot Password</label><input type="text" value={newAccount.password} onChange={e => setNewAccount({...newAccount, password: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none font-mono" /></div></div></section>
              </div>
              <div className="p-6 border-t border-white/5 bg-brand-dark flex gap-4"><button onClick={() => setShowAddModal(false)} className="flex-1 py-4 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-bold rounded-xl transition-all uppercase tracking-widest text-xs">Abort Deployment</button><button onClick={handleDeployAccount} className="flex-[2] py-4 bg-brand-accent hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-xl shadow-brand-accent/30 uppercase tracking-widest text-xs flex items-center justify-center gap-2"><Plus size={18} /> Deploy to Database</button></div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

interface StatBreakdown {
  label: string;
  value: string;
  color?: string;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: any;
  color: string;
  badge?: string;
  breakdowns?: StatBreakdown[];
}

const StatCard = ({ label, value, icon: Icon, color, badge, breakdowns }: StatCardProps) => (
  <div className="bg-brand-surface border border-white/10 rounded-xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -mr-10 -mt-10 group-hover:bg-white/[0.05] transition-all pointer-events-none" />
    
    <div className="flex items-start justify-between gap-3 relative z-10 mb-3">
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{label}</p>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300 uppercase">
              {badge}
            </span>
          )}
        </div>
        <h3 className={`text-2xl sm:text-3xl font-display font-black tracking-tight mt-1 ${color}`}>
          {value}
        </h3>
      </div>
      <div className="w-11 h-11 rounded-xl bg-brand-darker flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>

    {breakdowns && breakdowns.length > 0 && (
      <div className="pt-3 border-t border-white/5 grid grid-cols-3 gap-1 relative z-10 text-[10px] font-mono">
        {breakdowns.map((item, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider">{item.label}</span>
            <span className={`font-bold truncate ${item.color || 'text-slate-200'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Helper function to format rental exact start date and time
const formatRentalDateTime = (isoDateStr?: string) => {
  if (!isoDateStr) return { date: 'N/A', time: '', isFuture: false };
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return { date: 'N/A', time: '', isFuture: false };
    
    const date = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();

    const isFuture = d.getTime() > Date.now();

    return { date, time, isFuture };
  } catch {
    return { date: 'N/A', time: '', isFuture: false };
  }
};

// Component to handle countdown logic and rental timings efficiently
const BookingTimer: React.FC<{ booking: Booking }> = ({ booking }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const start = new Date(booking.startTime).getTime();
      const end = new Date(booking.endTime).getTime();

      if (now < start) {
        // Pre-booked / Upcoming
        const diff = start - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setDisplayText(`Starts in ${h}h ${m}m`);
      } else if (now < end) {
        // Active
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setDisplayText(`Ends in ${h}h ${m}m`);
      } else {
        setDisplayText('Expired');
      }
    };
    update();
    const interval = setInterval(update, 60000); // Update every minute is enough for admin table
    return () => clearInterval(interval);
  }, [booking]);

  if (booking.status === BookingStatus.CANCELLED) return <span className="text-slate-500 font-mono text-xs">Terminated</span>;
  if (booking.status === BookingStatus.COMPLETED) {
    const endInfo = formatRentalDateTime(booking.endTime);
    return (
      <div className="font-mono text-xs">
        <span className="text-slate-400 font-bold">Finished</span>
        {endInfo.time && (
          <div className="text-[10px] text-slate-500 mt-0.5">Ended: {endInfo.time}</div>
        )}
      </div>
    );
  }
  if (booking.status === BookingStatus.PENDING) return <span className="text-yellow-500 font-mono text-xs font-semibold">Pending Action</span>;

  const isFuture = new Date(booking.startTime).getTime() > Date.now();
  const endInfo = formatRentalDateTime(booking.endTime);
  
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs font-bold font-mono ${isFuture ? 'text-purple-400' : 'text-green-400'}`}>
         <Clock size={12} /> {displayText}
      </div>
      {!isFuture && endInfo.time && (
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Until {endInfo.time}</div>
      )}
    </div>
  );
};

const BookingTable = ({ bookings, onUpdateStatus, onDelete }: any) => {
  const handleAuthorize = (booking: Booking) => {
    // Determine smart status: If start time is future -> PRE_BOOKED, else ACTIVE
    const isFuture = new Date(booking.startTime).getTime() > Date.now();
    const newStatus = isFuture ? BookingStatus.PRE_BOOKED : BookingStatus.ACTIVE;
    onUpdateStatus(booking.orderId, newStatus);
  };

  return (
    <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden overflow-x-auto shadow-2xl">
      <table className="w-full text-left text-sm min-w-[920px]">
        <thead>
           <tr className="bg-brand-darker text-slate-500 border-b border-white/10 uppercase font-bold tracking-widest text-[10px]">
              <th className="p-5">Order ID</th>
              <th className="p-5">Source</th>
              <th className="p-5">Agent</th>
              <th className="p-5">Rental Started</th>
              <th className="p-5">Status</th>
              <th className="p-5">Timer</th>
              <th className="p-5 text-right">Operation</th>
           </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {bookings.map((b: any) => (
            <tr key={b.orderId} className="hover:bg-white/5 transition-colors group">
              <td className="p-5 font-mono text-xs text-brand-cyan">{b.orderId}</td>
              <td className="p-5">
                 <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase border ${b.listingType === 'USER' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                    {b.listingType === 'USER' ? 'USER LISTING' : 'PLATFORM'}
                 </span>
                 {b.listerName && b.listingType === 'USER' && (
                    <div className="text-[9px] text-slate-500 mt-1">Owner: {b.listerName}</div>
                 )}
              </td>
              <td className="p-5"><div className="text-white font-bold">{b.accountName}</div><div className="text-[10px] text-slate-500 font-mono">UTR: {b.utr}</div></td>
              <td className="p-5 whitespace-nowrap">
                {(() => {
                  const startRaw = b.startTime || b.createdAt;
                  const { date, time, isFuture } = formatRentalDateTime(startRaw);

                  if (date === 'N/A') {
                    return <span className="text-slate-500 text-xs font-mono">N/A</span>;
                  }

                  return (
                    <div>
                      <div className="flex items-center gap-1.5 text-white font-mono text-xs font-bold">
                        <Calendar size={13} className="text-brand-cyan" />
                        <span>{date}</span>
                        {isFuture && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold uppercase tracking-wider">
                            Pre-Booked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono mt-1">
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Clock size={11} />
                          <span>{time}</span>
                        </span>
                        {b.durationLabel && (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-slate-300 uppercase font-semibold">
                            {b.durationLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </td>
              <td className="p-5">
                <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                  b.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                  b.status === 'PRE_BOOKED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  b.status === 'CANCELLED' ? 'bg-slate-700/50 text-slate-400 border border-white/10' :
                  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                }`}>
                  {b.status === 'CANCELLED' && <Ban size={10} className="inline mr-1" />}
                  {b.status}
                </span>
              </td>
              <td className="p-5">
                 <BookingTimer booking={b} />
              </td>
              <td className="p-5 text-right">
                <div className="flex justify-end gap-2">
                  {b.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] font-mono text-slate-500 italic">Unpaid</span>
                      <button 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to remove this unpaid booking request?")) {
                            onDelete(b.orderId);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] rounded font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                        title="Remove unpaid booking from database"
                      >
                        <Trash2 size={12} /> REMOVE
                      </button>
                    </div>
                  )}
                  {(b.status === 'ACTIVE' || b.status === 'PRE_BOOKED') && (
                    <button 
                      onClick={() => {
                        if(window.confirm("Terminate this session? The account will be released immediately for new bookings.")) {
                          onUpdateStatus(b.orderId, BookingStatus.CANCELLED);
                        }
                      }} 
                      className="px-4 py-2 bg-brand-accent text-white text-[10px] rounded font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg flex items-center gap-1.5"
                    >
                      <Ban size={12} /> CANCEL
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
