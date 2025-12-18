
import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { AIService } from '../services/ai';
import { Account, Booking, BookingStatus, Rank, User, HomeConfig, Review, Skin, HeroSlide, TrustItem, StepItem } from '../types';
import { Plus, Trash2, Check, X, Edit2, Loader2, LogOut, Square, CheckSquare, BarChart3, IndianRupee, Users, Gamepad2, Home, Save, Zap, Shield, Star, MessageSquare, AlertCircle, Cpu, Search, Video, FileText, Play, Copy, Terminal, Layout, Image as ImageIcon } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'accounts' | 'users' | 'edithome' | 'auditor'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [loading, setLoading] = useState(true);
  
  const [configSaved, setConfigSaved] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Local Editor states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Partial<Review> | null>(null);
  const [auditLogs, setAuditLogs] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '', rank: Rank.IRON, skins: [], pricing: { hours3: 0, hours12: 0, hours24: 0 },
    imageUrl: 'https://picsum.photos/400/300'
  });

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
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const stats = useMemo(() => ({
    totalBookings: bookings.length,
    monthlyRevenue: bookings.filter(b => (b.status === BookingStatus.ACTIVE || b.status === BookingStatus.COMPLETED)).reduce((sum, b) => sum + b.totalPrice, 0),
    activeRentals: accounts.filter(a => a.isBooked).length,
    totalUsers: users.length
  }), [bookings, accounts, users]);

  if (!isAuthenticated) return <Navigate to="/admin" />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-darker"><Loader2 className="w-10 h-10 text-brand-accent animate-spin" /></div>;

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Vanguard <span className="text-brand-accent">OS</span></h1>
        <div className="flex gap-3">
           <button onClick={() => setActiveTab('auditor')} className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${activeTab === 'auditor' ? 'bg-brand-cyan text-brand-dark border-brand-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-brand-surface border-white/10 text-slate-400'}`}><Cpu size={16} /> Auditor</button>
           <button onClick={() => { localStorage.removeItem('isAdmin'); sessionStorage.removeItem('isAdmin'); navigate('/admin'); }} className="p-2.5 bg-brand-surface border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 transition-all"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`₹${stats.monthlyRevenue}`} icon={IndianRupee} color="text-green-400" />
        <StatCard label="Bookings" value={stats.totalBookings.toString()} icon={BarChart3} color="text-blue-400" />
        <StatCard label="Active" value={stats.activeRentals.toString()} icon={Gamepad2} color="text-brand-accent" />
        <StatCard label="Users" value={stats.totalUsers.toString()} icon={Users} color="text-purple-400" />
      </div>

      <div className="flex bg-brand-dark p-1 rounded-lg border border-white/10 w-fit mb-8 overflow-x-auto shadow-2xl">
        {[
          { id: 'bookings', icon: BarChart3, label: 'Bookings' },
          { id: 'accounts', icon: Gamepad2, label: 'Accounts' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'edithome', icon: Layout, label: 'Edit Home' }
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-6 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'bookings' && <BookingTable bookings={bookings} onUpdateStatus={async (id: string, s: BookingStatus) => { await StorageService.updateBookingStatus(id, s); refreshData(); }} />}
      
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div onClick={() => setShowAddModal(true)} className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:border-brand-accent hover:bg-white/5 transition-all group">
            <Plus className="w-10 h-10 mb-2 text-slate-600 group-hover:text-brand-accent group-hover:scale-110 transition-all" /> 
            <span className="font-bold text-slate-500 group-hover:text-white tracking-widest uppercase text-xs">Deploy New Agent</span>
          </div>
          {accounts.map(acc => (
            <div key={acc.id} className="bg-brand-surface border border-white/10 rounded-xl p-5 flex justify-between items-center group hover:border-brand-accent/50 transition-all shadow-lg">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-white/5">
                      <img src={acc.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                      <div className="font-bold text-white text-sm uppercase tracking-tight">{acc.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{acc.rank} // {acc.id}</div>
                  </div>
              </div>
              <Link to={`/admin/edit/${acc.id}`} className="p-2.5 bg-brand-surface border border-white/10 text-slate-400 rounded-lg hover:bg-brand-cyan hover:text-brand-dark hover:border-brand-cyan transition-all"><Edit2 size={16} /></Link>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'edithome' && (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sticky Header with Save Button */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-brand-surface p-5 border border-white/10 rounded-xl sticky top-4 z-40 backdrop-blur-xl shadow-2xl gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 rounded-lg bg-brand-accent/20 text-brand-accent">
                    <Layout size={20} />
                 </div>
                 <div>
                    <h2 className="font-bold text-white uppercase tracking-widest text-sm">Storefront Architect</h2>
                    <p className="text-[10px] text-slate-500 font-mono">ALL DEVICE SYNC ENABLED</p>
                 </div>
              </div>
              <button 
                onClick={saveGlobalConfig} 
                disabled={isSavingConfig}
                className={`w-full md:w-auto px-10 py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-white shadow-xl transition-all uppercase tracking-widest text-xs ${configSaved ? 'bg-green-600' : 'bg-brand-accent hover:bg-red-600 active:scale-95 disabled:opacity-50'}`}
              >
                {isSavingConfig ? <Loader2 className="animate-spin" size={16} /> : configSaved ? <Check size={16} /> : <Save size={16} />} 
                {configSaved ? 'DEPLOYED SUCCESSFULLY' : isSavingConfig ? 'UPLOADING...' : 'SAVE ALL CHANGES'}
              </button>
            </div>

            {/* Marquee Alerts Editor */}
            <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-[0.3em] text-slate-400 border-b border-white/5 pb-4">
                    <Zap className="text-brand-cyan" size={16} /> Marquee Broadcasts
                </h3>
                <div className="space-y-3">
                    {homeConfig.marqueeText.map((text, idx) => (
                        <div key={idx} className="flex gap-3 items-center group">
                            <span className="text-[10px] font-mono text-slate-600 bg-brand-dark px-2 py-1 rounded">0{idx+1}</span>
                            <input 
                                type="text" 
                                value={text} 
                                onChange={e => {
                                    const m = [...homeConfig.marqueeText];
                                    m[idx] = e.target.value;
                                    setHomeConfig({...homeConfig, marqueeText: m});
                                }}
                                className="flex-1 bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-cyan outline-none transition-all"
                                placeholder="Alert message..."
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Hero Carousel Editor */}
            <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-[0.3em] text-slate-400 border-b border-white/5 pb-4">
                    <Shield className="text-brand-accent" size={16} /> Combat Carousel (Hero Slides)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {homeConfig.heroSlides.map((slide, idx) => (
                        <div key={slide.id} className="bg-brand-dark border border-white/5 p-6 rounded-xl space-y-4 group hover:border-brand-accent/30 transition-all">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">MODULE 0{idx+1}</span>
                                <div className="flex gap-2">
                                   <button 
                                      onClick={() => {
                                        const s = homeConfig.heroSlides.filter(h => h.id !== slide.id);
                                        setHomeConfig({...homeConfig, heroSlides: s});
                                      }}
                                      className="text-slate-600 hover:text-red-500"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Headline</label>
                                <input type="text" value={slide.title} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].title = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Briefing (Subtitle)</label>
                                <input type="text" value={slide.subtitle} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].subtitle = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-slate-400 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Accent CSS</label>
                                    <input type="text" value={slide.accent} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].accent = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-cyan text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Btn CSS</label>
                                    <input type="text" value={slide.buttonColor} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].buttonColor = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-accent text-xs font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Intelligence URL (Image)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={slide.image} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].image = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="flex-1 bg-brand-surface border border-white/10 rounded px-3 py-2 text-slate-500 text-[10px] font-mono" />
                                    <div className="w-10 h-10 bg-black rounded overflow-hidden flex-shrink-0 border border-white/10">
                                        <img src={slide.image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            const newSlide: HeroSlide = {
                                id: Date.now(),
                                image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
                                title: "NEW OPERATION",
                                subtitle: "Briefing description here.",
                                accent: "text-white",
                                buttonColor: "bg-brand-accent"
                            };
                            setHomeConfig({...homeConfig, heroSlides: [...homeConfig.heroSlides, newSlide]});
                        }}
                        className="border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center p-8 hover:bg-white/5 text-slate-600 hover:text-white transition-all group min-h-[250px]"
                    >
                        <Plus className="mr-2 group-hover:scale-125 transition-all" size={20} /> Add Hero Module
                    </button>
                </div>
            </section>

            {/* Trust & Steps Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                    <h3 className="text-xs font-bold text-white mb-6 uppercase tracking-[0.3em] text-slate-400 border-b border-white/5 pb-4">
                        <Star className="text-yellow-400" size={16} /> Trust Pillars
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {homeConfig.trustItems.map((item, idx) => (
                            <div key={idx} className="bg-brand-dark p-4 rounded-xl space-y-3">
                                <label className="block text-[8px] font-bold text-slate-600 uppercase">LABEL 0{idx+1}</label>
                                <input type="text" value={item.label} onChange={e => { const t = [...homeConfig.trustItems]; t[idx].label = e.target.value; setHomeConfig({...homeConfig, trustItems: t}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-1.5 text-white text-sm font-bold" />
                                <input type="text" value={item.sub} onChange={e => { const t = [...homeConfig.trustItems]; t[idx].sub = e.target.value; setHomeConfig({...homeConfig, trustItems: t}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-1.5 text-slate-500 text-[10px] uppercase font-mono" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                    <h3 className="text-xs font-bold text-white mb-6 uppercase tracking-[0.3em] text-slate-400 border-b border-white/5 pb-4">
                        <Gamepad2 className="text-brand-cyan" size={16} /> Deployment Steps
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {homeConfig.stepItems.map((item, idx) => (
                            <div key={idx} className="bg-brand-dark p-4 rounded-xl space-y-3">
                                <label className="block text-[8px] font-bold text-slate-600 uppercase">STEP 0{idx+1}</label>
                                <input type="text" value={item.title} onChange={e => { const s = [...homeConfig.stepItems]; s[idx].title = e.target.value; setHomeConfig({...homeConfig, stepItems: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-1.5 text-white text-sm font-bold" />
                                <input type="text" value={item.desc} onChange={e => { const s = [...homeConfig.stepItems]; s[idx].desc = e.target.value; setHomeConfig({...homeConfig, stepItems: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-1.5 text-slate-400 text-xs" />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Community Intel Editor */}
            <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                        <MessageSquare className="text-brand-secondary" size={16} /> Community Intel (Reviews)
                    </h3>
                    <button 
                        onClick={() => { setEditingReview({ type: 'text', name: '', rank: 'Silver', quote: '', rating: 5 }); setShowReviewModal(true); }}
                        className="px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-cyan hover:text-brand-dark transition-all"
                    >
                        + NEW INTEL
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {homeConfig.reviews.map((rev) => (
                        <div key={rev.id} className="bg-brand-dark border border-white/5 p-5 rounded-xl group relative overflow-hidden">
                            <div className="flex justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {rev.type === 'video' ? <Video size={16} className="text-brand-cyan" /> : <FileText size={16} className="text-brand-secondary" />}
                                    <div>
                                        <div className="text-white font-bold text-sm">{rev.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-mono">{rev.rank}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingReview(rev); setShowReviewModal(true); }} className="p-1.5 bg-brand-surface rounded hover:text-brand-cyan transition-colors"><Edit2 size={12} /></button>
                                    <button onClick={() => { if(confirm('Delete review?')) { setHomeConfig({...homeConfig, reviews: homeConfig.reviews.filter(r => r.id !== rev.id)}); } }} className="p-1.5 bg-brand-surface rounded hover:text-brand-accent transition-colors"><Trash2 size={12} /></button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 italic line-clamp-2">"{rev.quote}"</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Terminal CTA Editor */}
            <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <h3 className="text-xs font-bold text-white mb-6 uppercase tracking-[0.3em] text-slate-400 border-b border-white/5 pb-4">
                    <Zap className="text-brand-accent" size={16} /> Terminal Call-to-Action
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Headline Line 1</label>
                            <input type="text" value={homeConfig.cta.titleLine1} onChange={e => setHomeConfig({...homeConfig, cta: {...homeConfig.cta, titleLine1: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2 text-white font-bold" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Headline Line 2 (Glitch)</label>
                            <input type="text" value={homeConfig.cta.titleLine2} onChange={e => setHomeConfig({...homeConfig, cta: {...homeConfig.cta, titleLine2: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2 text-brand-accent font-bold" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Final Briefing</label>
                            <textarea value={homeConfig.cta.subtitle} onChange={e => setHomeConfig({...homeConfig, cta: {...homeConfig.cta, subtitle: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2 text-slate-400 text-xs h-[104px] resize-none" />
                        </div>
                    </div>
                </div>
            </section>
         </div>
      )}

      {/* Review Edit Modal */}
      {showReviewModal && editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-50"></div>
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                 <MessageSquare className="text-brand-cyan" size={20} /> Intel Management
              </h2>
              <div className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Intel Type</label>
                        <select value={editingReview.type} onChange={e => setEditingReview({...editingReview, type: e.target.value as any})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2.5 text-white text-sm outline-none">
                            <option value="text">TEXT DEBRIEF</option>
                            <option value="video">VIDEO EVIDENCE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Agent Rank</label>
                        <input type="text" value={editingReview.rank || ''} onChange={e => setEditingReview({...editingReview, rank: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2.5 text-white text-sm outline-none" placeholder="e.g. Radiant" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Agent Callsign</label>
                    <input type="text" value={editingReview.name || ''} onChange={e => setEditingReview({...editingReview, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2.5 text-white text-sm outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Quote Content</label>
                    <textarea value={editingReview.quote || ''} onChange={e => setEditingReview({...editingReview, quote: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2.5 text-white text-sm h-24 resize-none outline-none" />
                 </div>
                 {editingReview.type === 'video' && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Thumbnail URL</label>
                            <input type="text" value={editingReview.thumbnail || ''} onChange={e => setEditingReview({...editingReview, thumbnail: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2.5 text-brand-cyan text-[10px] font-mono outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Video MP4 URL</label>
                            <input type="text" value={editingReview.videoUrl || ''} onChange={e => setEditingReview({...editingReview, videoUrl: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded px-4 py-2.5 text-brand-cyan text-[10px] font-mono outline-none" />
                        </div>
                    </div>
                 )}
              </div>
              <div className="flex gap-4 mt-10">
                 <button 
                   onClick={() => {
                        const reviews = [...homeConfig.reviews];
                        const index = reviews.findIndex(r => r.id === editingReview.id);
                        if (index >= 0) reviews[index] = editingReview as Review;
                        else reviews.push({ ...editingReview, id: Date.now() } as Review);
                        setHomeConfig({...homeConfig, reviews});
                        setShowReviewModal(false);
                   }} 
                   className="flex-1 bg-brand-accent py-4 rounded-xl font-black text-white shadow-xl hover:bg-red-600 transition-all uppercase tracking-widest text-xs"
                 >
                    DEPLOY INTEL
                 </button>
                 <button 
                   onClick={() => setShowReviewModal(false)} 
                   className="flex-1 border border-white/10 py-4 rounded-xl text-slate-500 hover:text-white transition-colors uppercase tracking-widest text-xs"
                 >
                    ABORT
                 </button>
              </div>
           </div>
        </div>
      )}

      {showAddModal && <AddModal 
        newAccount={newAccount} setNewAccount={setNewAccount} onClose={() => setShowAddModal(false)} 
        onAdd={async () => { await StorageService.saveAccount({ ...newAccount, id: 'kv-'+Date.now(), isBooked: false, bookedUntil: null } as Account); refreshData(); setShowAddModal(false); }} />}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-brand-surface border border-white/10 rounded-xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 group-hover:bg-white/10 transition-all"></div>
    <div className="relative z-10"><p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2">{label}</p><h3 className={`text-3xl font-display font-black tracking-tight ${color}`}>{value}</h3></div>
    <div className="w-12 h-12 rounded-xl bg-brand-darker flex items-center justify-center border border-white/5 relative z-10"><Icon className={`w-6 h-6 ${color}`} /></div>
  </div>
);

const BookingTable = ({ bookings, onUpdateStatus }: any) => (
  <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden overflow-x-auto shadow-2xl">
    <table className="w-full text-left text-sm">
      <thead><tr className="bg-brand-darker text-slate-500 border-b border-white/10 uppercase font-bold tracking-widest text-[10px]"><th className="p-5">Order ID</th><th className="p-5">Agent</th><th className="p-5">Status</th><th className="p-5 text-right">Operation</th></tr></thead>
      <tbody className="divide-y divide-white/5">
        {bookings.map((b: any) => (
          <tr key={b.orderId} className="hover:bg-white/5 transition-colors group">
            <td className="p-5 font-mono text-xs text-brand-cyan">{b.orderId}</td>
            <td className="p-5">
                <div className="text-white font-bold">{b.accountName}</div>
                <div className="text-[10px] text-slate-500 font-mono">UTR: {b.utr}</div>
            </td>
            <td className="p-5"><span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${b.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>{b.status}</span></td>
            <td className="p-5 text-right">{b.status === 'PENDING' && <button onClick={() => onUpdateStatus(b.orderId, 'ACTIVE')} className="px-5 py-2 bg-brand-accent text-white text-[10px] rounded font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-brand-accent/20">AUTHORIZE</button>}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {bookings.length === 0 && <div className="p-20 text-center text-slate-600 font-mono text-xs">NO ACTIVE DEPLOYMENTS FOUND.</div>}
  </div>
);

const AddModal = ({ newAccount, setNewAccount, onClose, onAdd }: any) => {
    const [isSaving, setIsSaving] = useState(false);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50"></div>
            <h2 className="text-xl font-bold mb-8 text-white flex items-center gap-3">
                <Shield className="text-brand-accent" /> Agent Deployment
            </h2>
            <div className="space-y-5">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Display Alias</label>
                    <input className="w-full bg-brand-dark border border-white/10 rounded-lg p-3.5 text-white outline-none focus:border-brand-accent" placeholder="Account Name" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Rank Bracket</label>
                    <select className="w-full bg-brand-dark border border-white/10 rounded-lg p-3.5 text-white outline-none focus:border-brand-accent" value={newAccount.rank} onChange={e => setNewAccount({...newAccount, rank: e.target.value as Rank})}>
                        {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Thumbnail URL</label>
                    <input className="w-full bg-brand-dark border border-white/10 rounded-lg p-3.5 text-brand-cyan text-[10px] font-mono outline-none" value={newAccount.imageUrl} onChange={e => setNewAccount({...newAccount, imageUrl: e.target.value})} />
                </div>
            </div>
            <div className="flex gap-4 mt-10">
                <button onClick={async () => { setIsSaving(true); await onAdd(); setIsSaving(false); }} className="flex-1 bg-brand-accent py-4 rounded-xl font-black text-white shadow-xl hover:bg-red-600 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'DEPLOY AGENT'}
                </button>
                <button onClick={onClose} className="flex-1 border border-white/10 py-4 rounded-xl text-slate-500 hover:text-white uppercase tracking-widest text-xs">ABORT</button>
            </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
