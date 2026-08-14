import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in (persistent or session)
    const isAuthenticated = localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded for MVP
    if (username === 'pruthvi' && password === 'mh14df5116') {
      if (rememberMe) {
        localStorage.setItem('isAdmin', 'true');
        sessionStorage.removeItem('isAdmin'); // Clear session to avoid conflicts
      } else {
        sessionStorage.setItem('isAdmin', 'true');
        localStorage.removeItem('isAdmin'); // Clear persistent to avoid conflicts
      }
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-brand-surface border border-white/10 rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-accent/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-brand-accent" />
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-slate-400">Restricted Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-accent text-white"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-accent text-white"
              placeholder="Enter password"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-brand-dark text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-surface accent-brand-accent cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-slate-400 hover:text-white cursor-pointer select-none">Remember me</label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-brand-accent hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;