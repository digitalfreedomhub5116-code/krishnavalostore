
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-brand-accent animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
        <div className="flex gap-3">
           <button onClick={() => setActiveTab('auditor')} className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${activeTab === 'auditor' ? 'bg-brand-cyan text-brand-dark' : 'bg-brand-surface border-white/10 text-slate-400'}`}><Cpu size={16} /> Auditor</button>
           <button onClick={() => { localStorage.removeItem('isAdmin'); sessionStorage.removeItem('isAdmin'); navigate('/admin'); }} className="p-2.5 bg-brand-surface border border-white/10 rounded-lg text-slate-400"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`₹${stats.monthlyRevenue}`} icon={IndianRupee} color="text-green-400" />
        <StatCard label="Bookings" value={stats.totalBookings.toString()} icon={BarChart3} color="text-blue-400" />
        <StatCard label="Active" value={stats.activeRentals.toString()} icon={Gamepad2} color="text-brand-accent" />
        <StatCard label="Users" value={stats.totalUsers.toString()} icon={Users} color="text-purple-400" />
      </div>

      <div className="flex bg-brand-dark p-1 rounded-lg border border-white/10 w-fit mb-8 overflow-x-auto">
        {['bookings', 'accounts', 'users', 'edithome'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-md text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-brand-accent text-white' : 'text-slate-400 hover:text-white'}`}>{tab === 'edithome' ? 'Edit Home' : tab}</button>
        ))}
      </div>

      {activeTab === 'bookings' && <BookingTable bookings={bookings} onUpdateStatus={async (id: string, s: BookingStatus) => { await StorageService.updateBookingStatus(id, s); refreshData(); }} />}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div onClick={() => setShowAddModal(true)} className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:border-brand-accent hover:bg-white/5 transition-all"><Plus className="w-8 h-8 mb-2" /> Add ID</div>
          {accounts.map(acc => (
            <div key={acc.id} className="bg-brand-surface border border-white/10 rounded-xl p-4 flex justify-between items-center">
              <div><div className="font-bold text-white">{acc.name}</div><div className="text-xs text-slate-500">{acc.rank}</div></div>
              <Link to={`/admin/edit/${acc.id}`} className="p-2 bg-brand-cyan/20 text-brand-cyan rounded-lg hover:bg-brand-cyan hover:text-brand-dark transition-all"><Edit2 size={16} /></Link>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'edithome' && (
         <div className="bg-brand-surface p-6 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold flex items-center gap-2"><Home /> Storefront Editor</h2>
               <button onClick={async () => { await StorageService.saveHomeConfig(homeConfig); setConfigSaved(true); setTimeout(() => setConfigSaved(false), 2000); }} className={`px-6 py-2 rounded-lg font-bold transition-all ${configSaved ? 'bg-green-600' : 'bg-brand-accent'} text-white`}>{configSaved ? 'Saved!' : 'Save Config'}</button>
            </div>
            <div className="space-y-4">
               {homeConfig.heroSlides.map((slide, i) => (
                  <div key={i} className="p-4 bg-brand-dark rounded-lg space-y-2">
                     <input className="w-full bg-brand-surface p-2 rounded text-sm text-white" value={slide.title} onChange={e => { const s = [...homeConfig.heroSlides]; s[i].title = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} />
                     <input className="w-full bg-brand-surface p-2 rounded text-xs text-slate-400" value={slide.image} onChange={e => { const s = [...homeConfig.heroSlides]; s[i].image = e.target.value; setHomeConfig({...homeConfig, heroSlides: s}); }} />
                  </div>
               ))}
            </div>
         </div>
      )}
      
      {showAddModal && <AddModal newAccount={newAccount} setNewAccount={setNewAccount} onClose={() => setShowAddModal(false)} onAdd={async () => { await StorageService.saveAccount({ ...newAccount, id: 'kv-'+Date.now(), isBooked: false, bookedUntil: null } as Account); refreshData(); setShowAddModal(false); }} />}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-brand-surface border border-white/10 rounded-xl p-5 flex items-center justify-between shadow-lg">
    <div><p className="text-slate-400 text-[10px] uppercase font-bold mb-1">{label}</p><h3 className={`text-2xl font-bold ${color}`}>{value}</h3></div>
    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Icon className={`w-5 h-5 ${color}`} /></div>
  </div>
);

const BookingTable = ({ bookings, onUpdateStatus }: any) => (
  <div className="bg-brand-surface border border-white/10 rounded-xl overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead><tr className="bg-brand-dark text-slate-400 border-b border-white/10"><th className="p-4">Order ID</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead>
      <tbody className="divide-y divide-white/5">
        {bookings.map((b: any) => (
          <tr key={b.orderId} className="hover:bg-white/5 transition-colors">
            <td className="p-4 font-mono text-xs">{b.orderId}</td>
            <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{b.status}</span></td>
            <td className="p-4 text-right">{b.status === 'PENDING' && <button onClick={() => onUpdateStatus(b.orderId, 'ACTIVE')} className="px-3 py-1 bg-green-600 text-white text-[10px] rounded font-bold">APPROVE</button>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AddModal = ({ newAccount, setNewAccount, onClose, onAdd }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-6">
      <h2 className="text-xl font-bold mb-4">Add Account</h2>
      <input className="w-full bg-brand-dark border border-white/10 rounded p-3 text-white mb-4" placeholder="Display Name" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
      <div className="flex gap-4">
        <button onClick={onAdd} className="flex-1 bg-brand-accent py-3 rounded font-bold text-white">SAVE</button>
        <button onClick={onClose} className="flex-1 border border-white/20 py-3 rounded text-slate-400">CANCEL</button>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
