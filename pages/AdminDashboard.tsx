import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { AIService } from '../services/ai';
import { Account, Booking, BookingStatus, Rank, User, HomeConfig, Review, Skin } from '../types';
import { Plus, Trash2, Check, X, Edit2, Loader2, LogOut, Square, CheckSquare, BarChart3, IndianRupee, Users, Gamepad2, Home, Save, Zap, Shield, Star, MessageSquare, AlertCircle, Cpu, Search, CheckCircle2, Video, FileText, Play, Copy, Terminal } from 'lucide-react';

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
  const [showExport, setShowExport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Editor States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Partial<Review> | null>(null);
  const [auditLogs, setAuditLogs] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{matches: string[], summary: string} | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '',
    rank: Rank.IRON,
    skins: [],
    pricing: { hours3: 0, hours12: 0, hours24: 0 },
    imageUrl: 'https://picsum.photos/400/300'
  });
  const [skinInput, setSkinInput] = useState('');

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
      setSelectedIds(new Set());
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
    await refreshData();
  };

  const handleRunAudit = async () => {
    if (!auditLogs.trim()) return;
    setIsAuditing(true);
    try {
      const pendingList = bookings
        .filter(b => b.status === BookingStatus.PENDING)
        .map(b => ({ utr: b.utr || '', orderId: b.orderId }));

      if (pendingList.length === 0) {
        setAuditResult({ matches: [], summary: "No pending bookings found." });
        return;
      }

      const result = await AIService.auditTransactions(auditLogs, pendingList);
      await Promise.all(result.matches.map(id => StorageService.updateBookingStatus(id, BookingStatus.ACTIVE)));
      setAuditResult(result);
      setAuditLogs('');
      await refreshData();
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDeleteAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this account?')) {
      await StorageService.deleteAccount(id);
      await refreshData();
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.size} accounts?`)) {
       await StorageService.deleteAccounts(Array.from(selectedIds));
       await refreshData();
    }
  };

  const handleAddAccount = async () => {
    setIsSubmitting(true);
    const account: Account = {
      id: 'kv-' + Date.now(),
      name: newAccount.name || 'New ID',
      rank: newAccount.rank || Rank.IRON,
      skins: newAccount.skins || [],
      pricing: newAccount.pricing as any,
      imageUrl: newAccount.imageUrl || '',
      isBooked: false,
      bookedUntil: null
    };
    await StorageService.saveAccount(account);
    setShowAddModal(false);
    await refreshData();
    setIsSubmitting(false);
  };

  const saveHomeConfig = async () => {
    await StorageService.saveHomeConfig(homeConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const handleSaveReview = () => {
    if (!editingReview?.name) return;
    const reviews = [...homeConfig.reviews];
    const index = reviews.findIndex(r => r.id === editingReview.id);
    if (index >= 0) reviews[index] = editingReview as Review;
    else reviews.push({ ...editingReview, id: Date.now() } as Review);
    setHomeConfig({ ...homeConfig, reviews });
    setShowReviewModal(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
        <div className="flex gap-3">
           <button onClick={() => setActiveTab('auditor')} className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${activeTab === 'auditor' ? 'bg-brand-cyan text-brand-dark border-brand-cyan' : 'bg-brand-surface border-white/10 text-slate-400'}`}><Cpu size={16} /> Auditor</button>
           <button onClick={handleLogout} className="p-2.5 bg-brand-surface border border-white/10 rounded-lg text-slate-400"><LogOut size={20} /></button>
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
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-md text-sm font-medium capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{tab === 'edithome' ? 'Edit Home' : tab}</button>
        ))}
      </div>

      {activeTab === 'bookings' && <BookingTable bookings={bookings} onUpdateStatus={handleStatusUpdate} />}

      {activeTab === 'auditor' && (
        <div className="bg-brand-surface border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Cpu className="text-brand-cyan" /> AI Transaction Auditor</h2>
            <textarea value={auditLogs} onChange={(e) => setAuditLogs(e.target.value)} placeholder="Paste bank logs here..." className="w-full h-48 bg-brand-dark border border-white/10 rounded-xl p-4 text-slate-300 font-mono text-sm focus:outline-none mb-6 resize-none" />
            <button onClick={handleRunAudit} disabled={isAuditing || !auditLogs} className="w-full bg-brand-cyan text-brand-darker font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              {isAuditing ? <Loader2 className="animate-spin" /> : <Search />} {isAuditing ? 'ANALYZING...' : 'START AI AUDIT'}
            </button>
            {auditResult && <div className="mt-6 p-4 bg-brand-dark border border-white/10 rounded-xl text-sm text-slate-400">{auditResult.summary}</div>}
        </div>
      )}

      {activeTab === 'accounts' && (
        <>
          <div className="flex justify-between mb-6">
            <button onClick={() => setSelectedIds(selectedIds.size === accounts.length ? new Set() : new Set(accounts.map(a => a.id)))} className="text-sm text-slate-400 flex items-center gap-2">
              {selectedIds.size === accounts.length && accounts.length > 0 ? <CheckSquare className="text-brand-accent" /> : <Square />} Select All
            </button>
            {selectedIds.size > 0 && <button onClick={handleBulkDelete} className="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg border border-red-600/50 flex items-center gap-2 text-sm font-bold"><Trash2 size={16} /> Delete Selected</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => setShowAddModal(true)} className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[300px] cursor-pointer hover:border-brand-accent hover:bg-white/5 transition-all group">
              <div className="w-12 h-12 rounded-full bg-brand-dark group-hover:bg-brand-accent flex items-center justify-center mb-4"><Plus className="w-6 h-6 text-white" /></div>
              <span className="font-bold text-white">Add New ID</span>
            </div>
            {accounts.map(account => (
              <div key={account.id} className={`bg-brand-surface border rounded-xl overflow-hidden relative group ${selectedIds.has(account.id) ? 'border-brand-accent' : 'border-white/10'}`}>
                <div className="h-40 relative">
                  <img src={account.imageUrl} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-white px-4 text-center">{account.name}</div>
                  <button onClick={(e) => handleToggleSelect(account.id, e)} className="absolute top-3 left-3 w-6 h-6 rounded bg-black/50 border border-white/30 flex items-center justify-center">{selectedIds.has(account.id) && <Check size={14} className="text-brand-accent" />}</button>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Link to={`/admin/edit/${account.id}`} className="p-2 bg-brand-cyan/80 text-brand-dark rounded-lg"><Edit2 size={16} /></Link>
                    <button onClick={(e) => handleDeleteAccount(account.id, e)} className="p-2 bg-red-500/80 text-white rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="p-4 text-sm flex justify-between border-t border-white/5">
                   <span className="text-slate-400">Status:</span>
                   <span className={account.isBooked ? 'text-red-400' : 'text-green-400'}>{account.isBooked ? 'Booked' : 'Available'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'edithome' && (
        <div className="space-y-8">
           <div className="flex justify-between items-center bg-brand-surface p-4 border border-white/10 rounded-xl sticky top-20 z-20 backdrop-blur-md">
              <h2 className="font-bold text-white flex items-center gap-2"><Home size={20} /> Storefront Manager</h2>
              <button onClick={saveHomeConfig} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 text-white shadow-lg ${configSaved ? 'bg-green-600' : 'bg-brand-accent hover:bg-red-600'}`}>{configSaved ? <Check size={20} /> : <Save size={20} />} {configSaved ? 'Saved!' : 'Save All Changes'}</button>
           </div>
           
           <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3"><Shield className="text-brand-accent" /> Hero Carousel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {homeConfig.heroSlides.map((slide, idx) => (
                    <div key={slide.id} className="bg-brand-dark border border-white/5 p-5 rounded-xl space-y-4">
                       <input type="text" value={slide.title} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].title = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" placeholder="Title" />
                       <input type="text" value={slide.subtitle} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].subtitle = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-white text-sm" placeholder="Subtitle" />
                       <input type="text" value={slide.image} onChange={e => { const s = [...homeConfig.heroSlides]; s[idx].image = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} className="w-full bg-brand-surface border border-white/10 rounded px-3 py-2 text-brand-cyan text-xs font-mono" placeholder="Image URL" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6">Review Manager</h2>
              <input value={editingReview?.name || ''} onChange={e => setEditingReview({...editingReview, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded p-3 text-white mb-4" placeholder="Agent Name" />
              <textarea value={editingReview?.quote || ''} onChange={e => setEditingReview({...editingReview, quote: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded p-3 text-white mb-4 h-32" placeholder="Testimonial" />
              <div className="flex gap-4">
                 <button onClick={handleSaveReview} className="flex-1 bg-brand-accent py-3 rounded-lg font-bold text-white">Save</button>
                 <button onClick={() => setShowReviewModal(false)} className="flex-1 border border-white/10 py-3 rounded-lg text-slate-400">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {showAddModal && <AddModal 
        newAccount={newAccount} setNewAccount={setNewAccount} onClose={() => setShowAddModal(false)} 
        onAdd={handleAddAccount} skinInput={skinInput} setSkinInput={setSkinInput} 
        addSkin={() => { if(skinInput) { setNewAccount({...newAccount, skins: [...(newAccount.skins || []), { name: skinInput, isHighlighted: false }]}); setSkinInput(''); } }} 
        isSubmitting={isSubmitting} 
      />}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-brand-surface border border-white/10 rounded-xl p-5 flex items-center justify-between shadow-lg">
    <div><p className="text-slate-400 text-xs uppercase font-bold mb-1">{label}</p><h3 className={`text-2xl font-bold ${color}`}>{value}</h3></div>
    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Icon className={`w-5 h-5 ${color}`} /></div>
  </div>
);

const BookingTable = ({ bookings, onUpdateStatus }: any) => (
  <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
    <table className="w-full text-left">
      <thead><tr className="bg-brand-dark text-slate-400 text-sm border-b border-white/10"><th className="p-4">Order ID</th><th className="p-4">Account</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
      <tbody className="divide-y divide-white/5">
        {bookings.map((b: any) => (
          <tr key={b.orderId} className="hover:bg-white/5 transition-colors">
            <td className="p-4 font-mono text-xs text-white">{b.orderId}</td>
            <td className="p-4 text-slate-300">{b.accountName} <div className="text-[10px] text-slate-500">UTR: {b.utr}</div></td>
            <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{b.status}</span></td>
            <td className="p-4 flex gap-2">
              {b.status === 'PENDING' && <><button onClick={() => onUpdateStatus(b.orderId, 'ACTIVE')} className="px-3 py-1 bg-green-600 rounded text-white text-[10px] font-bold uppercase">Approve</button><button onClick={() => onUpdateStatus(b.orderId, 'CANCELLED')} className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/50 rounded text-[10px] font-bold uppercase">Reject</button></>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {bookings.length === 0 && <div className="p-10 text-center text-slate-500">No bookings yet.</div>}
  </div>
);

const AddModal = ({ newAccount, setNewAccount, onClose, onAdd, skinInput, setSkinInput, addSkin, isSubmitting }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-white">Add Account</h2>
      <div className="space-y-4">
        <input className="w-full bg-brand-dark border border-white/10 rounded p-3 text-white" placeholder="Name" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
        <div className="flex gap-2">
          <input className="flex-1 bg-brand-dark border border-white/10 rounded p-3 text-white" placeholder="Skin Name" value={skinInput} onChange={e => setSkinInput(e.target.value)} />
          <button onClick={addSkin} className="bg-brand-accent px-4 rounded text-white">+</button>
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <button onClick={onAdd} disabled={isSubmitting} className="flex-1 bg-brand-accent py-3 rounded font-bold text-white">{isSubmitting ? 'SAVING...' : 'ADD ACCOUNT'}</button>
        <button onClick={onClose} className="flex-1 border border-white/20 py-3 rounded text-slate-400">CANCEL</button>
      </div>
    </div>
  </div>
);

export default AdminDashboard;