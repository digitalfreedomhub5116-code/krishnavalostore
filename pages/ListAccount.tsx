
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Rank, Account } from '../types';
import { Loader2, Save, ArrowLeft, Image as ImageIcon, Plus, X, Shield, DollarSign } from 'lucide-react';

const ListAccount: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [rank, setRank] = useState<Rank>(Rank.IRON);
  const [region, setRegion] = useState('Mumbai');
  const [level, setLevel] = useState<number>(20);
  const [imageUrl, setImageUrl] = useState('');
  
  const [pricing, setPricing] = useState({
    hours1: 29,
    hours3: 49,
    hours12: 149,
    hours24: 249
  });
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [skinInput, setSkinInput] = useState('');
  const [skins, setSkins] = useState<string[]>([]);
  
  const currentUser = StorageService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { returnTo: '/list-account' } });
    }
  }, [currentUser, navigate]);

  const handleAddSkin = () => {
    if (skinInput.trim()) {
      setSkins([...skins, skinInput.trim()]);
      setSkinInput('');
    }
  };

  const handleRemoveSkin = (idx: number) => {
    setSkins(skins.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!name || !imageUrl || !username || !password) {
      alert("Please fill all required fields, including login credentials.");
      return;
    }

    // Basic URL validation
    try {
        new URL(imageUrl);
    } catch (_) {
        alert("Please enter a valid Image URL.");
        return;
    }

    setLoading(true);

    const newAccount: Account = {
      id: 'USR-' + Date.now(),
      name,
      rank,
      region,
      level,
      imageUrl,
      pricing: {
        hours1: Number(pricing.hours1),
        hours3: Number(pricing.hours3),
        hours12: Number(pricing.hours12),
        hours24: Number(pricing.hours24),
      },
      skins: skins.map(s => ({ name: s, isHighlighted: false })),
      username,
      password,
      listedBy: currentUser.id,
      listedByName: currentUser.name, // Save the lister's name
      isBooked: false,
      bookedUntil: null,
      initialSkinsCount: 10,
      description: `User listed account. Region: ${region}. Level: ${level}.`
    };

    try {
      await StorageService.saveAccount(newAccount);
      navigate('/dashboard');
    } catch (error) {
      console.error("Listing failed", error);
      alert("Failed to list account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">List New <span className="text-brand-accent">ID</span></h1>
        <p className="text-slate-400 text-sm mt-1">Earn money by renting your idle Valorant account.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Visuals & Pricing */}
        <div className="space-y-6">
           <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon size={16} className="text-brand-cyan" /> Visuals</h3>
              
              <div className="mb-4">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Screenshot URL</label>
                 <input 
                   type="text" 
                   value={imageUrl}
                   onChange={e => setImageUrl(e.target.value)}
                   placeholder="https://imgur.com/..."
                   className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none text-sm font-mono text-brand-cyan"
                 />
              </div>

              {/* Live Preview */}
              <div className="aspect-video bg-black rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
                 {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/000000/FFF?text=Invalid+Image')} />
                 ) : (
                    <div className="text-center text-slate-600">
                       <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                       <span className="text-xs uppercase font-bold">Preview</span>
                    </div>
                 )}
              </div>
           </div>

           <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign size={16} className="text-green-400" /> Rental Pricing (₹)</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">1 Hour</label>
                     <input type="number" value={pricing.hours1} onChange={e => setPricing({...pricing, hours1: parseInt(e.target.value)})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-brand-accent outline-none" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">3 Hours</label>
                     <input type="number" value={pricing.hours3} onChange={e => setPricing({...pricing, hours3: parseInt(e.target.value)})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-brand-accent outline-none" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">12 Hours</label>
                     <input type="number" value={pricing.hours12} onChange={e => setPricing({...pricing, hours12: parseInt(e.target.value)})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-brand-accent outline-none" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">24 Hours</label>
                     <input type="number" value={pricing.hours24} onChange={e => setPricing({...pricing, hours24: parseInt(e.target.value)})} className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-brand-accent outline-none" />
                  </div>
               </div>
           </div>
        </div>

        {/* RIGHT COLUMN: Details & Auth */}
        <div className="space-y-6">
            <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Account Details</h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Title</label>
                     <input 
                       type="text" 
                       value={name}
                       onChange={e => setName(e.target.value)}
                       placeholder="e.g. Stacked Reaver Vandal Account"
                       className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none"
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rank</label>
                        <select value={rank} onChange={e => setRank(e.target.value as Rank)} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none cursor-pointer">
                           {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Region</label>
                        <select value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none cursor-pointer">
                           <option value="Mumbai">Mumbai</option>
                           <option value="Singapore">Singapore</option>
                           <option value="Tokyo">Tokyo</option>
                           <option value="Sydney">Sydney</option>
                           <option value="Europe">Europe</option>
                           <option value="NA">North America</option>
                        </select>
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Level</label>
                     <input 
                       type="number" 
                       value={level}
                       onChange={e => setLevel(parseInt(e.target.value))}
                       className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none"
                     />
                  </div>
               </div>
            </div>

            <div className="bg-brand-surface border border-white/10 rounded-xl p-6">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Featured Skins</h3>
               <div className="flex gap-2 mb-4">
                  <input 
                     type="text" 
                     value={skinInput}
                     onChange={e => setSkinInput(e.target.value)}
                     onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkin())}
                     placeholder="Type skin name & press Enter"
                     className="flex-1 bg-brand-dark border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-accent text-sm"
                  />
                  <button type="button" onClick={handleAddSkin} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"><Plus size={20} /></button>
               </div>
               <div className="flex flex-wrap gap-2">
                  {skins.map((skin, idx) => (
                     <span key={idx} className="px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan rounded-md text-xs font-bold flex items-center gap-2">
                        {skin}
                        <button type="button" onClick={() => handleRemoveSkin(idx)} className="hover:text-white"><X size={12} /></button>
                     </span>
                  ))}
                  {skins.length === 0 && <span className="text-xs text-slate-500 italic">No skins added yet.</span>}
               </div>
            </div>

            <div className="bg-brand-surface border border-brand-accent/20 rounded-xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 blur-3xl pointer-events-none"></div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Shield size={16} className="text-brand-accent" /> Login Credentials</h3>
               <p className="text-[10px] text-slate-400 mb-4 bg-brand-dark p-3 rounded border border-white/5">
                  These details will be securely encrypted and only revealed to users who have paid for a rental slot.
               </p>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Riot Username</label>
                     <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none font-mono" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Riot Password</label>
                     <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-accent outline-none font-mono" />
                  </div>
               </div>
            </div>

            <button 
               type="submit" 
               disabled={loading}
               className="w-full py-4 bg-brand-accent hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-brand-accent/20 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
               {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
               {loading ? 'Submitting...' : 'List Account for Rent'}
            </button>
        </div>

      </form>
    </div>
  );
};

export default ListAccount;
