
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Account } from '../types';
import AccountCard from '../components/AccountCard';
import { Search, X } from 'lucide-react';

const Browse: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const loadAccounts = async () => {
    const data = await StorageService.getAccounts();
    setAccounts(data);
  };

  useEffect(() => {
    loadAccounts();
    
    // Subscribe to internal StorageService updates
    const unsubscribe = StorageService.subscribe(() => {
      loadAccounts();
    });

    const interval = setInterval(loadAccounts, 60000);
    window.addEventListener('storage', loadAccounts);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('storage', loadAccounts);
    };
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
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
               <p className="text-brand-cyan text-sm mt-1">{filteredAccounts.length} IDs Found</p>
             </div>
           ) : (
             <>
               <h1 className="text-3xl font-display font-bold text-white mb-2">Available Accounts</h1>
               <p className="text-slate-400">Choose your weapon. Rent instantly.</p>
             </>
           )}
        </div>
      </div>

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
            We couldn't find any IDs matching "{searchQuery}". Try searching for a different skin or rank.
          </p>
          <button 
             onClick={clearSearch}
             className="px-6 py-2 bg-brand-accent hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
          >
             Show All Accounts
          </button>
        </div>
      )}
    </div>
  );
};

export default Browse;
