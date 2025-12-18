import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { AIService } from '../services/ai';
import { Account, Booking, BookingStatus, Rank, User, HomeConfig, HeroSlide, Review, Skin } from '../types';
import { Plus, Trash2, Check, X, Edit2, Loader2, LogOut, Square, CheckSquare, BarChart3, IndianRupee, Users, Gamepad2, TrendingUp, Phone, Mail, Calendar, Home, Save, Zap, Shield, Star, MessageSquare, AlertCircle, Cpu, ClipboardList, Search, CheckCircle2, Video, FileText, Play, Copy, Terminal } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'accounts' | 'users' | 'edithome' | 'auditor'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [configSaved, setConfigSaved] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Review Editor State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Partial<Review> | null>(null);

  // Auditor State
  const [auditLogs, setAuditLogs] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{matches: string[], summary: string} | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '',
    rank: Rank.IRON,
    skins: [],
    totalSkins: undefined,
    description: '',
    pricing: { hours3: 0, hours12: 0, hours24: 0 },
    imageUrl: 'https://picsum.photos/400/300'
  });
  const [skinInput, setSkinInput] = useState('');

  const refreshData = async () => {
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
    setSelectedIds(new Set());
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const monthlyRevenue = bookings
      .filter(b => {
        const bookingDate = new Date(b.createdAt);
        const now = new Date();
        return (
          bookingDate.getMonth() === now.getMonth() && 
          bookingDate.getFullYear() === now.getFullYear() &&
          (b.status === BookingStatus.ACTIVE || b.status === BookingStatus.COMPLETED)
        );
      })
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const activeRentals = accounts.filter(a => a.isBooked).length;
    const totalUsers = users.length;

    return { totalBookings, monthlyRevenue, activeRentals, totalUsers };
  }, [bookings, accounts, users]);

  if (!isAuthenticated) return <Navigate to="/admin" />;

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    sessionStorage.removeItem('isAdmin');
    navigate('/admin');
  };

  const handleStatusUpdate = async (orderId: string, status: BookingStatus) => {
    await StorageService.updateBookingStatus(orderId, status);
    refreshData();
  };

  const handleRunAudit = async () => {
    if (!auditLogs.trim()) return;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      const pendingList = bookings
        .filter(b => b.status === BookingStatus.PENDING)
        .map(b => ({ utr: b.utr || '', orderId: b.orderId }));

      if (pendingList.length === 0) {
        setAuditResult({ matches: [], summary: "No pending bookings found to audit." });
        setIsAuditing(false);
        return;
      }

      const result = await AIService.auditTransactions(auditLogs, pendingList);
      
      await Promise.all(result.matches.map(orderId => 
        StorageService.updateBookingStatus(orderId, BookingStatus.ACTIVE)
      ));

      setAuditResult(result);
      setAuditLogs('');
      refreshData();
    } catch (err) {
      alert("Error during AI Audit. Check Console.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDeleteAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this account?')) {
      await StorageService.deleteAccount(id);
      refreshData();
    }
  };

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === accounts.length && accounts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(accounts.map(a => a.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} accounts?`)) {
       await StorageService.deleteAccounts(Array.from(selectedIds));
       refreshData();
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.pricing) return;
    setIsSubmitting(true);
    
    const account: Account = {
      id: 'kv-' + Date.now(),
      name: newAccount.name!,
      rank: newAccount.rank as Rank,
      skins: newAccount.skins || [],
      totalSkins: newAccount.totalSkins,
      description: newAccount.description,
      pricing: newAccount.pricing as any,
      imageUrl: newAccount.imageUrl || '',
      isBooked: false,
      bookedUntil: null
    };
    await StorageService.saveAccount(account);
    setNewAccount({
      name: '',
      rank: Rank.IRON,
      skins: [],
      totalSkins: undefined,
      description: '',
      pricing: { hours3: 0, hours12: 0, hours24: 0 },
      imageUrl: 'https://picsum.photos/400/300'
    });
    setSkinInput('');
    await refreshData();
    setIsSubmitting(false);
    setShowAddModal(false);
  };

  const saveHomeConfig = async () => {
    await StorageService.saveHomeConfig(homeConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const updateMarquee = (idx: number, text: string) => {
    const newMarquee = [...homeConfig.marqueeText];
    newMarquee[idx] = text;
    setHomeConfig({ ...homeConfig, marqueeText: newMarquee });
  };

  const handleAddReview = () => {
    setEditingReview({
      id: Date.now(),
      type: 'text',
      name: '',
      rank: 'Diamond',
      quote: '',
      rating: 5,
      date: 'Just now'
    });
    setShowReviewModal(true);
  };

  const handleEditReview = (review: Review) => {
    setEditingReview({ ...review });
    setShowReviewModal(true);
  };

  const handleSaveReview = () => {
    if (!editingReview || !editingReview.name || !editingReview.quote) return;
    
    const reviews = [...homeConfig.reviews];
    const index = reviews.findIndex(r => r.id === editingReview.id);
    
    if (index >= 0) {
      reviews[index] = editingReview as Review;
    } else {
      reviews.push(editingReview as Review);
    }
    
    setHomeConfig({ ...homeConfig, reviews });
    setShowReviewModal(false);
    setEditingReview(null);
  };

  const handleDeleteReview = (id: number) => {
    if (window.confirm("Remove this review from community intel?")) {
      const reviews = homeConfig.reviews.filter(r => r.id !== id);
      setHomeConfig({ ...homeConfig, reviews });
    }
  };

  const exportConfig = () => {
    const data = {
      home: homeConfig,
      accounts: accounts
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Full site configuration copied to clipboard! Send this to me to deploy it permanently.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setActiveTab('auditor')}
             className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${activeTab === 'auditor' ? 'bg-brand-cyan text-brand-dark border-brand-cyan shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-brand-surface border-white/10 text-slate-400 hover:text-white'}`}
           >
             <Cpu className="w-4 h-4" /> AI Auditor
           </button>
           <button onClick={handleLogout} className="p-2.5 bg-brand-surface border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 transition-all">
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Monthly Revenue" value={`₹${stats.monthlyRevenue}`} icon={IndianRupee} color="text-green-400" />
        <StatCard label="Total Bookings" value={stats.totalBookings.toString()} icon={BarChart3} color="text-blue-400" />
        <StatCard label="Active Rentals" value={stats.activeRentals.toString()} icon={Gamepad2} color="text-brand-accent" />
        <StatCard label="Total Users" value={stats.totalUsers.toString()} icon={Users} color="text-purple-400" />
      </div>

      <div className="flex bg-brand-dark p-1 rounded-lg border border-white/10 w-fit mb-8 overflow-x-auto">
        {['bookings', 'accounts', 'users', 'edithome'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            {tab === 'edithome' ? 'Edit Home' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'bookings' && <BookingTable bookings={bookings} onUpdateStatus={handleStatusUpdate} />}

      {activeTab === 'auditor' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-brand-surface border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/20 flex items-center justify-center border border-brand-cyan/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <Cpu className="w-6 h-6 text-brand-cyan" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Transaction Auditor</h2>
                <p className="text-sm text-slate-400">Paste your bank history or SMS logs below to auto-approve orders.</p>
              </div>
            </div>

            <div className="relative mb-6">
              <textarea 
                value={auditLogs}
                onChange={(e) => setAuditLogs(e.target.value)}
                placeholder="Paste raw bank logs here (e.g., 'Received ₹49 from... UTR: 40123...')"
                className="w-full h-48 bg-brand-dark border border-white/10 rounded-xl p-4 text-slate-300 font-mono text-sm focus:border-brand-cyan focus:outline-none transition-colors resize-none"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                 <div className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">GEMINI_3_FLASH</div>
              </div>
            </div>

            <button 
              onClick={handleRunAudit}
              disabled={isAuditing || !auditLogs.trim()}
              className="w-full bg-brand-cyan hover:bg-white text-brand-darker font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(0,240,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ANALYZING BANK RECORDS...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>START AI AUDIT</span>
                </>
              )}
            </button>

            {auditResult && (
              <div className="mt-8 animate-in slide-in-from-top-4 duration-500">
                <div className={`p-4 rounded-xl border flex items-start gap-4 ${auditResult.matches.length > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-brand-dark border-white/5'}`}>
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${auditResult.matches.length > 0 ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                      {auditResult.matches.length > 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                   </div>
                   <div>
                      <h4 className="font-bold text-white mb-1">Audit Summary</h4>
                      <p className="text-sm text-slate-400 mb-3">{auditResult.summary}</p>
                      
                      {auditResult.matches.length > 0 && (
                        <div className="space-y-2">
                           <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Matched & Approved Orders:</p>
                           <div className="flex flex-wrap gap-2">
                              {auditResult.matches.map(id => (
                                <span key={id} className="px-2 py-1 bg-green-500/20 border border-green-500/40 text-green-400 font-mono text-xs rounded-lg">
                                   {id}
                                </span>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <>
          <div className="flex items-center justify-between mb-4 bg-brand-surface p-3 rounded-lg border border-white/5">
            <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              {selectedIds.size > 0 && selectedIds.size === accounts.length ? <CheckSquare className="w-5 h-5 text-brand-accent" /> : <Square className="w-5 h-5" />}
              Select All
            </button>
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600 hover:text-white transition-all text-sm font-bold">
                <Trash2 className="w-4 h-4" /> Delete Selected
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => setShowAddModal(true)} className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[300px] cursor-pointer hover:border-brand-accent hover:bg-white/5 transition-all group">
              <div className="w-12 h-12 rounded-full bg-brand-dark group-hover:bg-brand-accent flex items-center justify-center transition-colors mb-4"><Plus className="w-6 h-6 text-white" /></div>
              <span className="font-bold text-lg">Add New ID</span>
            </div>

            {accounts.map(account => (
              <div key={account.id} className={`relative group transition-all duration-200 ${selectedIds.has(account.id) ? 'ring-2 ring-brand-accent transform scale-[1.02]' : ''}`}>
                <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden h-full">
                  <div className="h-40 relative">
                     <img src={account.imageUrl} className="w-full h-full object-cover opacity-50" alt="" />
                     <div className="absolute inset-0 flex items-center justify-center font-bold px-2 text-center">{account.name}</div>
                     <button onClick={(e) => handleToggleSelect(account.id, e)} className={`absolute top-3 left-3 w-6 h-6 rounded border flex items-center justify-center ${selectedIds.has(account.id) ? 'bg-brand-accent border-brand-accent text-white' : 'bg-black/50 border-white/30 text-transparent'}`}><Check className="w-4 h-4" /></button>
                     
                     <div className="absolute top-3 right-3 flex gap-2">
                        <Link to={`/admin/edit/${account.id}`} className="p-2 bg-brand-cyan/80 backdrop-blur-md text-brand-dark rounded-lg hover:bg-brand-cyan transition-all shadow-lg"><Edit2 className="w-4 h-4" /></Link>
                        <button onClick={(e) => handleDeleteAccount(account.id, e)} className="p-2 bg-red-500/80 backdrop-blur-md text-white rounded-lg hover:bg-red-600 transition-all shadow-lg"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
                  <div className="p-4 text-sm space-y-2">
                    <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400">ID:</span><span className="font-mono text-xs">{account.id}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className={`font-bold ${account.isBooked ? 'text-red-400' : 'text-green-400'}`}>{account.isBooked ? 'Booked' : 'Available'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Price (3h):</span><span>₹{account.pricing.hours3}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'edithome' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-brand-surface p-4 border border-white/10 rounded-xl sticky top-24 z-20 backdrop-blur-md">
              <h2 className="font-bold text-white flex items-center gap-2"><Home className="w-5 h-5" /> Home Configuration</h2>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setShowExport(!showExport)} 
                  className="flex-1 md:flex-none px-4 py-2 border border-white/10 text-slate-400 rounded-lg font-bold flex items-center justify-center gap-2 hover:text-white"
                >
                  <Terminal className="w-4 h-4" /> {showExport ? 'Hide Export' : 'Deploy Mode'}
                </button>
                <button 
                  onClick={saveHomeConfig} 
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${configSaved ? 'bg-green-600' : 'bg-brand-accent hover:bg-red-600'} text-white shadow-lg`}
                >
                  {configSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {configSaved ? 'Changes Saved!' : 'Save All Changes'}
                </button>
              </div>
           </div>

           {showExport && (
             <div className="bg-brand-dark border-2 border-brand-cyan/30 rounded-xl p-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 flex items-center justify-center text-brand-cyan"><Terminal className="w-5 h-5" /></div>
                   <h3 className="font-bold text-white">Permanent Deployment Suite</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">Changes saved above only apply to this device. To make them visible on all phones and computers permanently, copy the code below and send it to your developer (AI).</p>
                <div className="relative group">
                   <pre className="bg-black/80 rounded-lg p-4 text-[10px] text-brand-cyan font-mono overflow-x-auto max-h-[300px]">
                      {JSON.stringify({ home: homeConfig, accounts: accounts }, null, 2)}
                   </pre>
                   <button 
                    onClick={exportConfig}
                    className="absolute top-4 right-4 p-2 bg-brand-cyan text-brand-dark rounded hover:scale-110 transition-transform shadow-lg"
                   >
                     <Copy className="w-4 h-4" />
                   </button>
                </div>
             </div>
           )}

           {/* Marquee Section */}
           <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-brand-cyan" /> Marquee Alerts</h3>
              <div className="space-y-3">
                 {homeConfig.marqueeText.map((text, idx) => (
                    <div key={idx} className="flex gap-2">
                       <span className="bg-brand-dark px-3 py-2 rounded text-slate-500 font-mono text-sm flex items-center">#{idx+1}</span>
                       <input 
                         type="text" 
                         value={text} 
                         onChange={(e) => updateMarquee(idx, e.target.value)}
                         className="flex-1 bg-brand-dark border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-brand-cyan transition-colors"
                       />
                    </div>
                 ))}
              </div>
           </div>

           {/* Hero Section */}
           <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                 <Shield className="w-5 h-5 text-brand-accent" /> Hero Slides
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {homeConfig.heroSlides.map((slide, idx) => (
                    <div key={slide.id} className="bg-brand-dark border border-white/5 p-5 rounded-xl space-y-4">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Slide {idx+1}</span>
                          <div className="w-3 h-3 rounded-full bg-brand-accent animate-pulse" />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Title</label>
                          <input 
                            type="text" 
                            value={slide.title} 
                            onChange={(e) => {
                               const newSlides = [...homeConfig.heroSlides];
                               newSlides[idx].title = e.target.value;
                               setHomeConfig({...homeConfig, heroSlides: newSlides});
                            }}
                            className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Subtitle</label>
                          <input 
                            type="text" 
                            value={slide.subtitle} 
                            onChange={(e) => {
                               const newSlides = [...homeConfig.heroSlides];
                               newSlides[idx].subtitle = e.target.value;
                               setHomeConfig({...homeConfig, heroSlides: newSlides});
                            }}
                            className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Image URL</label>
                          <input 
                            type="text" 
                            value={slide.image} 
                            onChange={(e) => {
                               const newSlides = [...homeConfig.heroSlides];
                               newSlides[idx].image = e.target.value;
                               setHomeConfig({...homeConfig, heroSlides: newSlides});
                            }}
                            className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-xs font-mono"
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Community Intel Section */}
           <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                 <h3 className="text-lg font-bold flex items-center gap-2">
                    <Star className="w-5 h-5 text-brand-cyan" /> Community Intel
                 </h3>
                 <button 
                  onClick={handleAddReview}
                  className="px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-brand-cyan hover:text-brand-dark transition-all flex items-center gap-2"
                 >
                    <Plus className="w-4 h-4" /> Add Review
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {homeConfig.reviews.map((review) => (
                    <div key={review.id} className="bg-brand-dark border border-white/5 rounded-xl p-4 flex flex-col group relative overflow-hidden">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             {review.type === 'video' ? <Video className="w-4 h-4 text-brand-cyan" /> : <FileText className="w-4 h-4 text-brand-secondary" />}
                             <div>
                                <div className="text-white font-bold text-sm">{review.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase">{review.rank}</div>
                             </div>
                          </div>
                          <div className="flex gap-1">
                             <button onClick={() => handleEditReview(review)} className="p-1.5 text-slate-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                             <button onClick={() => handleDeleteReview(review.id)} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                       </div>
                       
                       {review.type === 'video' && review.thumbnail && (
                          <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-black">
                             <img src={review.thumbnail} className="w-full h-full object-cover opacity-60" alt="" />
                             <div className="absolute inset-0 flex items-center justify-center"><Play className="w-6 h-6 text-white" /></div>
                          </div>
                       )}

                       <p className="text-xs text-slate-400 italic line-clamp-3 mb-4 flex-1">"{review.quote}"</p>
                       
                       <div className="flex justify-between items-center pt-3 border-t border-white/5">
                          <span className="text-[10px] font-mono text-slate-600">{review.date || 'Recent'}</span>
                          {review.rating && (
                             <div className="flex gap-0.5 text-yellow-500">
                                {Array.from({length: review.rating}).map((_, i) => <Star key={i} size={8} fill="currentColor" />)}
                             </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showReviewModal && editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-brand-cyan" /> {editingReview.id ? 'Edit Review' : 'Add New Review'}
              </h2>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Review Type</label>
                       <select value={editingReview.type} onChange={e => setEditingReview({...editingReview, type: e.target.value as any})} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm">
                          <option value="text">Text Only</option>
                          <option value="video">Video Intel</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Agent Rank</label>
                       <input type="text" value={editingReview.rank} onChange={e => setEditingReview({...editingReview, rank: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm" placeholder="e.g. Immortal" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Agent Name</label>
                    <input type="text" value={editingReview.name} onChange={e => setEditingReview({...editingReview, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm" placeholder="Reviewer name" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Quote / Message</label>
                    <textarea value={editingReview.quote} onChange={e => setEditingReview({...editingReview, quote: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm h-24 resize-none" placeholder="What did they say?" />
                 </div>
                 {editingReview.type === 'video' ? (
                   <>
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Video Thumbnail URL</label>
                        <input type="text" value={editingReview.thumbnail} onChange={e => setEditingReview({...editingReview, thumbnail: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-brand-cyan text-xs font-mono" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Video Source URL (MP4)</label>
                        <input type="text" value={editingReview.videoUrl} onChange={e => setEditingReview({...editingReview, videoUrl: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-brand-cyan text-xs font-mono" />
                     </div>
                   </>
                 ) : (
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Rating (1-5)</label>
                        <input type="number" min="1" max="5" value={editingReview.rating} onChange={e => setEditingReview({...editingReview, rating: parseInt(e.target.value)})} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Date Label</label>
                        <input type="text" value={editingReview.date} onChange={e => setEditingReview({...editingReview, date: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm" placeholder="e.g. 2 days ago" />
                      </div>
                   </div>
                 )}
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={handleSaveReview} className="flex-1 bg-brand-accent py-3 rounded-lg font-bold text-white shadow-lg hover:bg-red-600 transition-colors uppercase tracking-widest text-xs">Save Review</button>
                 <button onClick={() => setShowReviewModal(false)} className="flex-1 border border-white/10 py-3 rounded-lg text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-xs">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {showAddModal && <AddModal 
        newAccount={newAccount} 
        setNewAccount={setNewAccount} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleAddAccount} 
        skinInput={skinInput} 
        setSkinInput={setSkinInput} 
        addSkin={() => {
          if(skinInput) {
            setNewAccount({...newAccount, skins: [...(newAccount.skins || []), { name: skinInput, isHighlighted: false }]});
            setSkinInput('');
          }
        }} 
        isSubmitting={isSubmitting} 
      />}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-brand-surface border border-white/10 rounded-xl p-5 flex items-center justify-between shadow-lg">
    <div>
      <p className="text-slate-400 text-xs uppercase font-bold mb-1">{label}</p>
      <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
    </div>
    <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
  </div>
);

const BookingTable = ({ bookings, onUpdateStatus }: any) => {
  const isStale = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return (now - createdTime) > (20 * 60 * 1000); // 20 mins
  };

  return (
    <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-brand-dark text-slate-400 text-sm border-b border-white/10">
            <th className="p-4">Order ID</th><th className="p-4">Account</th><th className="p-4">Status</th><th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {bookings.map((b: any) => {
            const stale = b.status === 'PENDING' && isStale(b.createdAt);
            
            return (
              <tr key={b.orderId} className={`hover:bg-white/5 transition-colors ${stale ? 'bg-red-500/5' : ''}`}>
                <td className="p-4">
                  <div className="font-mono text-xs">{b.orderId}</div>
                  <div className="text-[10px] text-slate-500">{new Date(b.createdAt).toLocaleTimeString()}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-white">{b.accountName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">UTR: {b.utr}</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${b.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {b.status}
                    </span>
                    {stale && (
                      <span className="flex items-center gap-1 text-[9px] text-red-400 font-bold uppercase">
                        <AlertCircle size={10} /> Timeout / Stale
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {b.status === 'PENDING' && (
                      <>
                        <button onClick={() => onUpdateStatus(b.orderId, 'ACTIVE')} className="px-3 py-1 bg-green-600 rounded text-white text-[10px] font-bold uppercase hover:bg-green-500">Approve</button>
                        <button onClick={() => onUpdateStatus(b.orderId, 'CANCELLED')} className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/50 rounded text-[10px] font-bold uppercase hover:bg-red-600 hover:text-white">Reject</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {bookings.length === 0 && (
            <tr>
                <td colSpan={4} className="p-10 text-center text-slate-500 italic">No bookings found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const AddModal = ({ newAccount, setNewAccount, onClose, onAdd, skinInput, setSkinInput, addSkin, isSubmitting }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Add New Account</h2>
      <div className="space-y-4">
        <input className="w-full bg-brand-dark border border-white/10 rounded p-2 text-white" placeholder="Name" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
        <select className="w-full bg-brand-dark border border-white/10 rounded p-2 text-white" value={newAccount.rank} onChange={e => setNewAccount({...newAccount, rank: e.target.value as Rank})}>{Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}</select>
        <div className="flex gap-2">
          <input className="flex-1 bg-brand-dark border border-white/10 rounded p-2 text-white" placeholder="Skin" value={skinInput} onChange={e => setSkinInput(e.target.value)} />
          <button onClick={addSkin} className="bg-brand-accent px-4 rounded text-white">+</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {newAccount.skins?.map((s: Skin, i: number) => (
            <span key={i} className={`px-2 py-1 rounded text-xs ${s.isHighlighted ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/50' : 'bg-white/10 text-white'}`}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <button onClick={onAdd} disabled={isSubmitting} className="flex-1 bg-brand-accent py-3 rounded font-bold text-white">{isSubmitting ? 'Adding...' : 'Add Account'}</button>
        <button onClick={onClose} className="flex-1 border border-white/20 py-3 rounded text-white">Cancel</button>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
