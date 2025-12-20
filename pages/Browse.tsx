
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Account, Rank } from '../types';
import AccountCard from '../components/AccountCard';
import { Search, X, Filter, ChevronDown, Loader2 } from 'lucide-react';

const Browse: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [selectedRank, setSelectedRank] = useState<string>('All');
  
  // Use useCallback to ensure the function reference remains stable for dependencies
  // Triggers Supabase Query with Rank Filter
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    // Fetch from Supabase, passing the rank filter if not 'All'
    const data = await StorageService.getAccounts(selectedRank === 'All' ? undefined : selectedRank);
    setAccounts(data);
    setLoading(false);
  }, [selectedRank]);

  useEffect(() => {
    loadAccounts();
    
    // Subscribe to real-time updates
    const unsubscribe = StorageService.subscribe(() => {
      loadAccounts();
    });

    // Auto-refresh interval
    const interval = setInterval(loadAccounts, 60000);
    window.addEventListener('storage', loadAccounts);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('storage', loadAccounts);
    };
  }, [loadAccounts]);

  // Client-side text filtering combined with server-side rank filtering
  const filteredAccounts = accounts.filter(account => {
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      return (
          account.name.toLowerCase().includes(term) ||
          account.skins.some(skin => skin.name.toLowerCase().includes(term)) ||
          account.rank.toLowerCase().includes(term) ||
          account.id.toLowerCase().includes(term)
      );
  });

  const clearSearch = () => {
    setSearchParams({});
  };

  const ranks = ['All', ...Object.values(Rank)];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        
        {/* Left Side: Title & Search Query Display */}
        <div className="flex-1">
           {searchQuery ? (
             <div className="animate-in fade-in slide-in-from-left-4 duration-300">
               <div className="text-slate-400 text-sm font-mono mb-1 uppercase tracking-wider">Search Results</div>
               <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-display font-bold text-white">
                   "{searchQuery}"
                 </h1>
                 <button 
                   onClick={clearSearch}
                   className="p-1.5 bg-white/10 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors"
                   title="Clear Search"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
               <p className="text-brand-cyan text-sm mt-1">
                  {filteredAccounts.length} IDs Found in {selectedRank === 'All' ? 'All Ranks' : selectedRank}
               </p>
             </div>
           ) : (
             <>
               <h1 className="text-3xl font-display font-bold text-white mb-2">Available Accounts</h1>
               <p className="text-slate-400">Choose your weapon. Rent instantly.</p>
             </>
           )}
        </div>

        {/* Right Side: Rank Filter Dropdown (Responsive) */}
        <div className="w-full lg:w-auto">
            <div className="relative group min-w-[200px] w-full lg:w-64">
                <div className="absolute inset-0 bg-brand-cyan/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                <div className="relative bg-brand-dark border border-white/10 rounded-xl overflow-hidden flex items-center shadow-lg transition-all group-hover:border-brand-cyan/50">
                    <div className="pl-4 text-slate-400">
                        <Filter className="w-4 h-4" />
                    </div>
                    <select 
                        value={selectedRank} 
                        onChange={(e) => setSelectedRank(e.target.value)}
                        className="w-full bg-transparent text-white font-bold text-sm px-4 py-3.5 outline-none cursor-pointer appearance-none uppercase tracking-wide z-10"
                    >
                        {ranks.map(rank => (
                            <option key={rank} value={rank} className="bg-brand-dark text-white py-2">
                                {rank === 'All' ? 'All Ranks' : rank}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 pointer-events-none text-brand-cyan">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-right mt-2 uppercase tracking-widest hidden lg:block">
                    {selectedRank === 'All' ? 'Filtering All Tiers' : `Filtering: ${selectedRank}`}
                </div>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-brand-accent animate-spin mb-4" />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Syncing with Vanguard Database...</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccounts.map(account => (
                <AccountCard 
                    key={account.id} 
                    account={account} 
                />
                ))}
            </div>

            {filteredAccounts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-full bg-brand-surface border border-white/5 flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No matching accounts</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                    {selectedRank !== 'All' 
                       ? `No ${selectedRank} accounts match your criteria.`
                       : `We couldn't find any IDs matching "${searchQuery}".`
                    }
                </p>
                <div className="flex gap-4">
                    {selectedRank !== 'All' && (
                        <button 
                            onClick={() => setSelectedRank('All')}
                            className="px-6 py-2 bg-brand-surface border border-white/10 hover:border-brand-cyan text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wide"
                        >
                            Reset Rank Filter
                        </button>
                    )}
                    {searchQuery && (
                        <button 
                            onClick={clearSearch}
                            className="px-6 py-2 bg-brand-accent hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wide"
                        >
                            Clear Search
                        </button>
                    )}
                </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default Browse;
