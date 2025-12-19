

import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { AIService } from '../services/ai';
import { Account, Booking, BookingStatus, Rank, User, HomeConfig, Review, Skin, HeroSlide, TrustItem, StepItem } from '../types';
import { Plus, Trash2, Check, X, Edit2, Loader2, LogOut, Square, CheckSquare, BarChart3, IndianRupee, Users, Gamepad2, Home, Save, Zap, Shield, Star, MessageSquare, AlertCircle, Cpu, Search, Video, FileText, Play, Copy, Terminal, Layout, Image as ImageIcon, ShieldCheck, Lock, Ban, Type as TypeIcon, Minus, Award } from 'lucide-react';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '', 
    rank: Rank.IRON, 
    skins: [], 
    pricing: { hours3: 49, hours12: 149, hours24: 249 },
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    username: '',
    password: '',
    description: 'Premium Valorant Account with verified skins.',
    initialSkinsCount: 10
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

  const stats = useMemo(() => ({
    totalBookings: bookings.length,
    monthlyRevenue: bookings.filter(b => (b.status === BookingStatus.ACTIVE || b.status === BookingStatus.COMPLETED)).reduce((sum, b) => sum + b.totalPrice, 0),
    activeRentals: accounts.filter(a => a.isBooked).length,
    totalUsers: users.length
  }), [bookings, accounts, users]);

  const handleAdjustPoints = async (userId: string, amount: number) => {
     await StorageService.updateUserPoints(userId, amount);
     refreshData();
  };

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
        name: '', rank: Rank.IRON, skins: [], pricing: { hours3: 49, hours12: 149, hours24: 249 },
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

  if (!isAuthenticated) return <Navigate to="/admin" />;
  if (loading && !showAddModal) return <div className="min-h-screen flex items-center justify-center bg-brand-darker"><Loader2 className="w-10 h-10 text-brand-accent animate-spin" /></div>;

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
          <button 
            onClick={() => setShowAddModal(true)} 
            className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:border-brand-accent hover:bg-white/5 transition-all group w-full text-left"
          >
            <Plus className="w-10 h-10 mb-2 text-slate-600 group-hover:text-brand-accent group-hover:scale-110 transition-all" /> 
            <span className="font-bold text-slate-500 group-hover:text-white tracking-widest uppercase text-xs">Deploy New Agent</span>
          </button>
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

      {activeTab === 'users' && (
        <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-brand-darker text-slate-500 border-b border-white/10 uppercase font-bold tracking-widest text-[10px]">
                <th className="p-5">Agent</th>
                <th className="p-5">Contact</th>
                <th className="p-5">Ultra Points</th>
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
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                       <Award size={14} className="text-yellow-500" />
                       <span className="font-black text-white">{user.ultraPoints || 0} UP</span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                     <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAdjustPoints(user.id, 50)}
                          className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded border border-green-500/20 transition-all"
                          title="Grant 50 UP"
                        >
                           <Plus size={14} />
                        </button>
                        <button 
                          onClick={() => handleAdjustPoints(user.id, -50)}
                          className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded border border-red-500/20 transition-all"
                          title="Deduct 50 UP"
                        >
                           <Minus size={14} />
                        </button>
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

            <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-[0.3em] text-slate-400"><Zap className="text-brand-cyan" size={16} /> Marquee Broadcasts</h3>
                    <button onClick={() => setHomeConfig({...homeConfig, marqueeText: [...homeConfig.marqueeText, "NEW ALERT MESSAGE"]})} className="text-[10px] font-bold text-brand-cyan hover:underline uppercase">+ ADD ALERT</button>
                </div>
                <div className="space-y-3">
                    {homeConfig.marqueeText.map((text, idx) => (
                        <div key={idx} className="flex gap-3 items-center group">
                            <span className="text-[10px] font-mono text-slate-600 bg-brand-dark px-2 py-1 rounded">0{idx+1}</span>
                            <input type="text" value={text} onChange={e => { const m = [...homeConfig.marqueeText]; m[idx] = e.target.value; setHomeConfig({...homeConfig, marqueeText: m}); }} className="flex-1 bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-cyan outline-none transition-all" />
                            <button onClick={() => { const m = homeConfig.marqueeText.filter((_, i) => i !== idx); setHomeConfig({...homeConfig, marqueeText: m}); }} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-[0.3em] text-slate-400 border-b border-white/5 pb-4"><Shield className="text-brand-accent" size={16} /> Combat Carousel (Hero Slides)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {homeConfig.heroSlides.map((slide, idx) => (
                        <div key={slide.id} className="bg-brand-dark border border-white/5 p-6 rounded-xl space-y-4 group hover:border-brand-accent/30 transition-all">
                            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">MODULE 0{idx+1}</span><button onClick={() => { const s = homeConfig.heroSlides.filter(h => h.id !== slide.id); setHomeConfig({...homeConfig, heroSlides: s}); }} className="text-slate-600 hover:text-red-500"><Trash2 size={14} /></button></div>
                            <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Headline</label><input type="text" value={slide.title} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].title = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" /></div>
                            <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Briefing (Subtitle)</label><input type="text" value={slide.subtitle} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].subtitle = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-slate-400 text-sm" /></div>
                            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Accent CSS</label><input type="text" value={slide.accent} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].accent = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-cyan text-xs font-mono" /></div><div className="space-y-1"><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Btn CSS</label><input type="text" value={slide.buttonColor} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].buttonColor = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-accent text-xs font-mono" /></div></div>
                            <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Intelligence URL (Image)</label><div className="flex gap-2"><input type="text" value={slide.image} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].image = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="flex-1 bg-brand-surface border border-white/10 rounded px-3 py-2 text-slate-500 text-[10px] font-mono" /><div className="w-10 h-10 bg-black rounded overflow-hidden flex-shrink-0 border border-white/10"><img src={slide.image} className="w-full h-full object-cover" alt="" /></div></div></div>
                        </div>
                    ))}
                    <button onClick={() => setHomeConfig({...homeConfig, heroSlides: [...homeConfig.heroSlides, { id: Date.now(), title: "NEW TITLE", subtitle: "NEW SUBTITLE", image: "", accent: "text-brand-accent", buttonColor: "bg-brand-accent" }]})} className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-slate-600 hover:border-brand-cyan hover:text-brand-cyan transition-all"><Plus size={24} /><span className="text-[10px] font-bold uppercase tracking-widest mt-2">Add New Slide</span></button>
                </div>
            </section>

            <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-[0.3em] text-slate-400"><Award className="text-yellow-500" size={16} /> Ultra Points Section</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Tagline</label>
                        <input type="text" value={homeConfig.ultraPoints?.tagline || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), tagline: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-yellow-500 focus:border-yellow-500 outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Title Part 1</label>
                            <input type="text" value={homeConfig.ultraPoints?.titlePart1 || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), titlePart1: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-white outline-none transition-all" />
                         </div>
                         <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Highlight (Yellow)</label>
                            <input type="text" value={homeConfig.ultraPoints?.titleHighlight || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), titleHighlight: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-yellow-500 focus:border-yellow-500 outline-none transition-all" />
                         </div>
                         <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Title Part 2 (New Line)</label>
                            <input type="text" value={homeConfig.ultraPoints?.titlePart2 || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), titlePart2: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-white outline-none transition-all" />
                         </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Description</label>
                        <textarea rows={3} value={homeConfig.ultraPoints?.description || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), description: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:border-white outline-none transition-all resize-none" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                         <div className="space-y-3">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Card 1 Config</h4>
                             <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Title</label>
                                <input type="text" value={homeConfig.ultraPoints?.card1Title || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), card1Title: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white" />
                             </div>
                             <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Description</label>
                                <input type="text" value={homeConfig.ultraPoints?.card1Desc || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), card1Desc: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-400" />
                             </div>
                         </div>
                         <div className="space-y-3">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Card 2 Config</h4>
                             <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Title</label>
                                <input type="text" value={homeConfig.ultraPoints?.card2Title || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), card2Title: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white" />
                             </div>
                             <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Description</label>
                                <input type="text" value={homeConfig.ultraPoints?.card2Desc || ''} onChange={e => setHomeConfig({...homeConfig, ultraPoints: {...(homeConfig.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!), card2Desc: e.target.value}})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-400" />
                             </div>
                         </div>
                    </div>
                </div>
            </section>

            <section className="bg-brand-surface border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-[0.3em] text-slate-400"><MessageSquare className="text-brand-cyan" size={16} /> Community Intel (Reviews)</h3>
                    <button onClick={() => setHomeConfig({...homeConfig, reviews: [...homeConfig.reviews, { id: Date.now(), type: 'text', name: 'Agent X', rank: 'Platinum', quote: 'New review entry...', rating: 5, date: new Date().toLocaleDateString('en-IN', {month: 'short', day: 'numeric'}) }]})} className="text-[10px] font-bold text-brand-cyan hover:underline uppercase">+ ADD INTEL</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {homeConfig.reviews.map((review, idx) => (
                        <div key={review.id} className="bg-brand-dark border border-white/5 p-6 rounded-xl space-y-4 group hover:border-brand-cyan/30 transition-all relative overflow-hidden">
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex gap-2">
                                   <button 
                                      onClick={() => { const r = [...homeConfig.reviews]; r[idx].type = 'text'; setHomeConfig({...homeConfig, reviews: r}); }}
                                      className={`px-3 py-1 text-[9px] font-black uppercase rounded ${review.type === 'text' ? 'bg-brand-cyan text-brand-dark' : 'bg-white/5 text-slate-500'}`}
                                   >
                                      TEXT
                                   </button>
                                   <button 
                                      onClick={() => { const r = [...homeConfig.reviews]; r[idx].type = 'video'; setHomeConfig({...homeConfig, reviews: r}); }}
                                      className={`px-3 py-1 text-[9px] font-black uppercase rounded ${review.type === 'video' ? 'bg-brand-accent text-white shadow-[0_0_10px_rgba(255,70,85,0.4)]' : 'bg-white/5 text-slate-500'}`}
                                   >
                                      VIDEO
                                   </button>
                                </div>
                                <button onClick={() => { const r = homeConfig.reviews.filter(item => item.id !== review.id); setHomeConfig({...homeConfig, reviews: r}); }} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Agent Name</label><input type="text" value={review.name} onChange={e => { const r = [...homeConfig.reviews]; r[idx].name = e.target.value; setHomeConfig({...homeConfig, reviews: r}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" /></div>
                               <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Agent Rank</label><input type="text" value={review.rank} onChange={e => { const r = [...homeConfig.reviews]; r[idx].rank = e.target.value; setHomeConfig({...homeConfig, reviews: r}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" /></div>
                            </div>

                            <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Intel Transmission (Quote)</label><textarea rows={3} value={review.quote} onChange={e => { const r = [...homeConfig.reviews]; r[idx].quote = e.target.value; setHomeConfig({...homeConfig, reviews: r}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-slate-300 text-sm italic resize-none" /></div>

                            {review.type === 'video' ? (
                               <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                  <div className="grid grid-cols-1 gap-3">
                                     <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Video Source URL (.mp4)</label><input type="text" value={review.videoUrl || ''} onChange={e => { const r = [...homeConfig.reviews]; r[idx].videoUrl = e.target.value; setHomeConfig({...homeConfig, reviews: r}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-cyan text-[10px] font-mono" placeholder="Direct MP4 link..." /></div>
                                     <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Thumbnail Intelligence URL</label><div className="flex gap-2"><input type="text" value={review.thumbnail || ''} onChange={e => { const r = [...homeConfig.reviews]; r[idx].thumbnail = e.target.value; setHomeConfig({...homeConfig, reviews: r}); }} className="flex-1 bg-brand-surface border border-white/10 rounded px-3 py-2 text-slate-500 text-[10px] font-mono" placeholder="Image link..." /><div className="w-10 h-10 bg-black rounded overflow-hidden flex-shrink-0 border border-white/10"><img src={review.thumbnail} className="w-full h-full object-cover" alt="" /></div></div></div>
                                  </div>
                               </div>
                            ) : (
                               <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                                  <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Rating (1-5)</label><input type="number" min="1" max="5" value={review.rating || 5} onChange={e => { const r = [...homeConfig.reviews]; r[idx].rating = parseInt(e.target.value); setHomeConfig({...homeConfig, reviews: r}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-yellow-400 font-bold" /></div>
                                  <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Timestamp</label><input type="text" value={review.date || ''} onChange={e => { const r = [...homeConfig.reviews]; r[idx].date = e.target.value; setHomeConfig({...homeConfig, reviews: r}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-slate-400 text-xs" /></div>
                               </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
         </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              <div className="p-6 border-b border-white/5 bg-brand-dark flex justify-between items-center"><div className="flex items-center gap-3"><ShieldCheck className="text-brand-cyan" size={24} /><h2 className="text-xl font-bold text-white uppercase tracking-tighter italic">Vanguard Agent Deployment</h2></div><button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button></div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 <section className="space-y-4"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-4">Identity & Visuals</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Display Name</label><input type="text" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none" placeholder="e.g. Radiant Beast #IND" /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Rank</label><select value={newAccount.rank} onChange={e => setNewAccount({...newAccount, rank: e.target.value as Rank})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none cursor-pointer">{Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}</select></div></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hero Intelligence URL (Image)</label><input type="text" value={newAccount.imageUrl} onChange={e => setNewAccount({...newAccount, imageUrl: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-brand-cyan font-mono text-xs focus:border-brand-cyan outline-none" /></div></section>
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
            <td className="p-5"><div className="text-white font-bold">{b.accountName}</div><div className="text-[10px] text-slate-500 font-mono">UTR: {b.utr}</div></td>
            <td className="p-5">
              <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                b.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                b.status === 'CANCELLED' ? 'bg-slate-700/50 text-slate-400 border border-white/10' :
                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
              }`}>
                {b.status === 'CANCELLED' && <Ban size={10} className="inline mr-1" />}
                {b.status}
              </span>
            </td>
            <td className="p-5 text-right">
              <div className="flex justify-end gap-2">
                {b.status === 'PENDING' && (
                  <button 
                    onClick={() => onUpdateStatus(b.orderId, BookingStatus.ACTIVE)} 
                    className="px-4 py-2 bg-brand-cyan text-brand-dark text-[10px] rounded font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg"
                  >
                    AUTHORIZE
                  </button>
                )}
                {b.status === 'ACTIVE' && (
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

export default AdminDashboard;
