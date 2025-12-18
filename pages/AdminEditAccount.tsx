import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Account, Rank, Pricing, Skin } from '../types';
import { ArrowLeft, Save, Trash2, Plus, X, Loader2, Image as ImageIcon, Gem, Shield, Clock, Star } from 'lucide-react';

const AdminEditAccount: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skinInput, setSkinInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }

    const loadAccount = async () => {
      if (id) {
        const data = await StorageService.getAccountById(id);
        if (data) {
          // Deep copy to avoid mutating original state before save
          setAccount(JSON.parse(JSON.stringify(data)));
        }
        setLoading(false);
      }
    };

    loadAccount();
  }, [id, isAuthenticated, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
    </div>
  );

  if (!account) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Account Not Found</h2>
      <Link to="/admin/dashboard" className="text-brand-accent hover:underline flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );

  const handleUpdateField = (field: keyof Account, value: any) => {
    setAccount({ ...account, [field]: value });
  };

  const handleUpdatePricing = (duration: keyof Pricing, value: string) => {
    const val = parseInt(value) || 0;
    setAccount({
      ...account,
      pricing: { ...account.pricing, [duration]: val }
    });
  };

  const addSkin = () => {
    if (skinInput.trim()) {
      setAccount({ 
        ...account, 
        skins: [...account.skins, { name: skinInput.trim(), isHighlighted: false }] 
      });
      setSkinInput('');
    }
  };

  const removeSkin = (idx: number) => {
    const newSkins = account.skins.filter((_, i) => i !== idx);
    setAccount({ ...account, skins: newSkins });
  };

  const toggleSkinHighlight = (idx: number) => {
    const newSkins = [...account.skins];
    newSkins[idx].isHighlighted = !newSkins[idx].isHighlighted;
    setAccount({ ...account, skins: newSkins });
  };

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);
    await StorageService.saveAccount(account);
    setSaving(false);
    navigate('/admin/dashboard');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Link to="/admin/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 mb-2 transition-colors text-sm font-bold uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Panel
          </Link>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
             <Shield className="w-8 h-8 text-brand-cyan" />
             EDIT ACCOUNT // <span className="text-brand-accent">{account.id}</span>
          </h1>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
           <button 
             onClick={handleSave}
             disabled={saving}
             className="flex-1 md:flex-none px-8 py-3 bg-brand-accent hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-accent/20"
           >
             {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
             Save Changes
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Col: Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-6 border-b border-white/5 pb-3 flex items-center gap-2">
               <Gem className="w-5 h-5 text-brand-cyan" /> General Metadata
            </h3>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={account.name}
                    onChange={(e) => handleUpdateField('name', e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rank Level</label>
                  <select 
                    value={account.rank}
                    onChange={(e) => handleUpdateField('rank', e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent transition-colors outline-none cursor-pointer"
                  >
                    {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Public Description (HTML/Text)</label>
                <textarea 
                  rows={4}
                  value={account.description || ''}
                  onChange={(e) => handleUpdateField('description', e.target.value)}
                  className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent transition-colors outline-none resize-none"
                  placeholder="Tell customers about this account..."
                />
              </div>
            </div>
          </div>

          <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-6 border-b border-white/5 pb-3 flex items-center gap-2">
               <Clock className="w-5 h-5 text-brand-accent" /> Pricing Structure (₹)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">3 Hours Rate</label>
                  <input 
                    type="number" 
                    value={account.pricing.hours3}
                    onChange={(e) => handleUpdatePricing('hours3', e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white font-mono"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">12 Hours Rate</label>
                  <input 
                    type="number" 
                    value={account.pricing.hours12}
                    onChange={(e) => handleUpdatePricing('hours12', e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white font-mono"
                  />
               </div>
               <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">24 Hours Rate</label>
                  <input 
                    type="number" 
                    value={account.pricing.hours24}
                    onChange={(e) => handleUpdatePricing('hours24', e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white font-mono"
                  />
                  <div className="absolute top-0 right-0 text-[8px] bg-brand-accent px-1 text-white rounded">BULK</div>
               </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 italic">Note: The system automatically applies a 10% discount on the 24h rate for the user interface if configured in checkout logic.</p>
          </div>

          <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-6 border-b border-white/5 pb-3 flex justify-between items-center">
               <span>Skin Inventory</span>
               <span className="text-xs text-slate-500 font-normal">Click star to highlight</span>
            </h3>
            <div className="flex gap-2 mb-6">
               <input 
                 type="text" 
                 placeholder="Search or enter skin name..."
                 value={skinInput}
                 onChange={(e) => setSkinInput(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && addSkin()}
                 className="flex-1 bg-brand-dark border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
               />
               <button 
                 onClick={addSkin}
                 className="px-4 py-2 bg-brand-cyan text-brand-dark font-bold rounded-lg hover:bg-cyan-400 transition-colors"
               >
                 Add
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
               {account.skins.map((skin, idx) => (
                 <div key={idx} className={`flex justify-between items-center bg-brand-dark border p-3 rounded-lg group transition-all ${skin.isHighlighted ? 'border-brand-cyan/50 shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'border-white/5'}`}>
                    <div className="flex items-center gap-2 truncate">
                       <button 
                        onClick={() => toggleSkinHighlight(idx)}
                        className={`transition-colors ${skin.isHighlighted ? 'text-brand-cyan' : 'text-slate-600 hover:text-slate-400'}`}
                        title={skin.isHighlighted ? "Remove Highlight" : "Highlight Skin"}
                       >
                          <Star className={`w-4 h-4 ${skin.isHighlighted ? 'fill-current' : ''}`} />
                       </button>
                       <span className={`text-xs truncate ${skin.isHighlighted ? 'text-brand-cyan font-bold' : 'text-slate-300'}`}>{skin.name}</span>
                    </div>
                    <button 
                      onClick={() => removeSkin(idx)}
                      className="text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2"
                    >
                       <X className="w-4 h-4" />
                    </button>
                 </div>
               ))}
               {account.skins.length === 0 && (
                 <div className="col-span-full py-8 text-center text-slate-600 italic">
                    No skins added yet.
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Col: Media & Status */}
        <div className="space-y-6">
           <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-6 border-b border-white/5 pb-3 flex items-center gap-2">
                 <ImageIcon className="w-5 h-5 text-brand-cyan" /> Account Preview
              </h3>
              <div className="rounded-lg overflow-hidden border border-white/10 bg-black aspect-video mb-4 flex items-center justify-center">
                 {account.imageUrl ? (
                    <img src={account.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                 ) : (
                    <ImageIcon className="w-12 h-12 text-slate-800" />
                 )}
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Image Source URL</label>
                 <input 
                    type="text" 
                    value={account.imageUrl}
                    onChange={(e) => handleUpdateField('imageUrl', e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-xs text-brand-cyan font-mono"
                    placeholder="https://..."
                 />
              </div>
           </div>

           <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-6 border-b border-white/5 pb-3">Security & Auth</h3>
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Login Username</label>
                    <input 
                       type="text" 
                       value={account.username || ''}
                       onChange={(e) => handleUpdateField('username', e.target.value)}
                       className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-mono"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Login Password</label>
                    <input 
                       type="text" 
                       value={account.password || ''}
                       onChange={(e) => handleUpdateField('password', e.target.value)}
                       className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2 text-sm text-brand-accent font-mono"
                    />
                 </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Current Status</span>
                    <span className={`text-xs font-bold uppercase ${account.isBooked ? 'text-red-400' : 'text-green-400'}`}>
                       {account.isBooked ? 'Busy / Rented' : 'Free / Available'}
                    </span>
                 </div>
                 {account.isBooked && (
                    <p className="mt-2 text-[10px] text-slate-500">
                       ID is currently locked until {new Date(account.bookedUntil!).toLocaleString()}
                    </p>
                 )}
              </div>
           </div>
           
           <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6">
              <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">
                 <Trash2 className="w-4 h-4" /> Danger Zone
              </h3>
              <p className="text-xs text-slate-500 mb-4">Deleting an account will remove all booking history associated with it. This cannot be undone.</p>
              <button 
                onClick={async () => {
                   if(window.confirm("Permanently delete this account?")) {
                      await StorageService.deleteAccount(account.id);
                      navigate('/admin/dashboard');
                   }
                }}
                className="w-full py-2 bg-red-600/10 border border-red-600/50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all"
              >
                 Delete Forever
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEditAccount;
