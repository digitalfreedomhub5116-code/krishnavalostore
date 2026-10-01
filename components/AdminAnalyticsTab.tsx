import React, { useState, useEffect } from 'react';
import { 
  Users, Eye, Clock, TrendingUp, Smartphone, Monitor, 
  AlertTriangle, CheckCircle2, Zap, RefreshCw, RotateCcw, 
  ArrowDownRight, BarChart3, Flame, HelpCircle
} from 'lucide-react';
import { Account, Booking, AnalyticsSummary, DailyAnalytics } from '../types';
import { AnalyticsService, DEFAULT_ANALYTICS_SUMMARY } from '../services/analytics';

interface AdminAnalyticsTabProps {
  accounts: Account[];
  bookings: Booking[];
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ accounts, bookings }) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(DEFAULT_ANALYTICS_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'views' | 'initiates' | 'conversion' | 'name'>('views');

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const data = await AnalyticsService.getSummary();
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all analytics counters? This cannot be undone.')) {
      setLoading(true);
      await AnalyticsService.resetSummary();
      await fetchAnalytics();
      alert('Analytics data has been reset.');
    }
  };

  // Helper for today's date key
  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const todayStats: DailyAnalytics = analytics.dailyStats?.[todayKey] || {
    date: todayKey,
    uniqueVisitors: 0,
    pageViews: 0,
    totalTimeSeconds: 0,
    sessions: 0,
    deviceMobile: 0,
    deviceDesktop: 0
  };

  // Format seconds to human readable (e.g. 2m 45s)
  const formatDuration = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds <= 0) return '0s';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const totalSessions = Math.max(1, analytics.totalSessions || 1);
  const avgSessionTime = Math.round((analytics.totalTimeSpentSeconds || 0) / totalSessions);
  const totalAccountViews = Object.values(analytics.accountStats || {}).reduce((sum, a) => sum + (a.views || 0), 0);

  // Funnel numbers
  const funnel = analytics.funnel || {
    siteVisits: 0,
    accountViews: 0,
    initiateClicks: 0,
    checkoutViews: 0,
    completedBookings: 0
  };

  const maxFunnelStep = Math.max(funnel.siteVisits, funnel.accountViews, 1);

  // Merge account data with analytics stats
  const accountRows = accounts.map(acc => {
    const stats = analytics.accountStats?.[acc.id] || { views: 0, initiates: 0, bookings: 0 };
    // Also cross-reference actual completed bookings
    const realBookingsCount = bookings.filter(b => b.accountId === acc.id).length;
    const effectiveBookings = Math.max(stats.bookings || 0, realBookingsCount);
    const conversionRate = stats.views > 0 ? ((stats.initiates / stats.views) * 100) : 0;
    const finalConversion = stats.views > 0 ? ((effectiveBookings / stats.views) * 100) : 0;

    // Diagnostic categorization
    let diagnosis: 'top' | 'hesitant' | 'quiet' | 'normal' = 'normal';
    if (stats.views >= 10 && conversionRate >= 20) {
      diagnosis = 'top';
    } else if (stats.views >= 15 && conversionRate < 8) {
      diagnosis = 'hesitant'; // People look at it, but don't rent! (Price/skin issue)
    } else if (stats.views < 5) {
      diagnosis = 'quiet'; // Not getting enough views
    }

    return {
      account: acc,
      views: stats.views,
      initiates: stats.initiates,
      bookings: effectiveBookings,
      conversionRate,
      finalConversion,
      diagnosis,
      lastViewedAt: stats.lastViewedAt
    };
  });

  // Sort account rows
  accountRows.sort((a, b) => {
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'initiates') return b.initiates - a.initiates;
    if (sortBy === 'conversion') return b.conversionRate - a.conversionRate;
    return a.account.name.localeCompare(b.account.name);
  });

  // Calculate Mobile vs Desktop ratio
  const totalDeviceLogs = (todayStats.deviceMobile || 0) + (todayStats.deviceDesktop || 0);
  const mobilePct = totalDeviceLogs > 0 ? Math.round((todayStats.deviceMobile / totalDeviceLogs) * 100) : 75;
  const desktopPct = 100 - mobilePct;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-brand-surface border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-accent/20 border border-brand-accent/40 text-brand-accent">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-black text-white uppercase italic tracking-wider">
                Store Intelligence & Traffic Telemetry
              </h2>
              <p className="text-xs text-slate-400">
                Real-time visitor counts, active browsing times, and per-ID conversion diagnostics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-brand-cyan' : ''} />
            Refresh
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <RotateCcw size={14} />
            Reset Data
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Visitors Today */}
        <div className="bg-brand-surface border border-white/10 rounded-xl p-5 relative overflow-hidden shadow-lg group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Visitors Today</span>
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <Users size={16} />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-white mb-1">
            {todayStats.uniqueVisitors}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-brand-cyan font-bold">{todayStats.pageViews}</span>
            <span>total page views today</span>
          </div>
        </div>

        {/* Avg Browsing Time */}
        <div className="bg-brand-surface border border-white/10 rounded-xl p-5 relative overflow-hidden shadow-lg group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Avg. Browsing Time</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-white mb-1">
            {formatDuration(avgSessionTime)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Total active time:</span>
            <span className="text-yellow-400 font-bold">{formatDuration(analytics.totalTimeSpentSeconds || 0)}</span>
          </div>
        </div>

        {/* Total ID Views */}
        <div className="bg-brand-surface border border-white/10 rounded-xl p-5 relative overflow-hidden shadow-lg group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Inventory ID Views</span>
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
              <Eye size={16} />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-white mb-1">
            {totalAccountViews}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-brand-accent font-bold">{funnel.initiateClicks}</span>
            <span>initiate rental clicks</span>
          </div>
        </div>

        {/* Overall Conversion Rate */}
        <div className="bg-brand-surface border border-white/10 rounded-xl p-5 relative overflow-hidden shadow-lg group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Conversion Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-emerald-400 mb-1">
            {totalAccountViews > 0 
              ? `${((funnel.completedBookings / Math.max(1, totalAccountViews)) * 100).toFixed(1)}%` 
              : '0.0%'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{funnel.completedBookings}</span>
            <span>paid rentals completed</span>
          </div>
        </div>

      </div>

      {/* CONVERSION FUNNEL & LEAK DIAGNOSTIC */}
      <div className="bg-brand-surface border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-cyan" />
              Customer Drop-Off Funnel ("Where Are We Lacking?")
            </h3>
            <p className="text-xs text-slate-400">
              Pinpoint the exact step where interested gamers hesitate or abandon their rental
            </p>
          </div>
        </div>

        {/* Funnel Visual Steps */}
        <div className="space-y-4">
          
          {/* Step 1: Store Visits */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center font-mono">1</span>
                Store Visits (Home & Browse)
              </span>
              <span className="font-mono text-slate-400 font-bold">{Math.max(funnel.siteVisits, funnel.accountViews)} visitors (100%)</span>
            </div>
            <div className="w-full bg-brand-dark h-3 rounded-full overflow-hidden border border-white/5">
              <div className="bg-slate-400 h-full rounded-full transition-all duration-700" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Step 2: Account Details Viewed */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan text-[10px] flex items-center justify-center font-mono">2</span>
                Inspected Specific Account ID
              </span>
              <span className="font-mono text-brand-cyan font-bold">
                {funnel.accountViews} views ({maxFunnelStep > 0 ? Math.round((funnel.accountViews / maxFunnelStep) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-brand-dark h-3 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-brand-cyan h-full rounded-full transition-all duration-700" 
                style={{ width: `${maxFunnelStep > 0 ? Math.min(100, Math.round((funnel.accountViews / maxFunnelStep) * 100)) : 0}%` }} 
              />
            </div>
          </div>

          {/* Step 3: Initiate Rental Clicked */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-[10px] flex items-center justify-center font-mono">3</span>
                Clicked "Initiate Rental"
              </span>
              <span className="font-mono text-yellow-400 font-bold">
                {funnel.initiateClicks} clicks ({funnel.accountViews > 0 ? Math.round((funnel.initiateClicks / funnel.accountViews) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-brand-dark h-3 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-yellow-400 h-full rounded-full transition-all duration-700" 
                style={{ width: `${maxFunnelStep > 0 ? Math.min(100, Math.round((funnel.initiateClicks / maxFunnelStep) * 100)) : 0}%` }} 
              />
            </div>
          </div>

          {/* Step 4: Checkout Reached */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] flex items-center justify-center font-mono">4</span>
                Opened Razorpay Payment Screen
              </span>
              <span className="font-mono text-brand-accent font-bold">
                {funnel.checkoutViews} checkouts ({funnel.initiateClicks > 0 ? Math.round((funnel.checkoutViews / funnel.initiateClicks) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-brand-dark h-3 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-brand-accent h-full rounded-full transition-all duration-700" 
                style={{ width: `${maxFunnelStep > 0 ? Math.min(100, Math.round((funnel.checkoutViews / maxFunnelStep) * 100)) : 0}%` }} 
              />
            </div>
          </div>

          {/* Step 5: Completed Payment & Credentials Received */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono">5</span>
                Payment Paid & Credentials Delivered
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {funnel.completedBookings} paid ({funnel.checkoutViews > 0 ? Math.round((funnel.completedBookings / funnel.checkoutViews) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-brand-dark h-3 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-700" 
                style={{ width: `${maxFunnelStep > 0 ? Math.min(100, Math.round((funnel.completedBookings / maxFunnelStep) * 100)) : 0}%` }} 
              />
            </div>
          </div>

        </div>

        {/* Automated Intelligence Tip */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
          <Zap size={18} className="text-brand-cyan shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white uppercase tracking-wider block mb-0.5">Automated Optimization Tip:</span>
            {funnel.accountViews > 0 && (funnel.initiateClicks / funnel.accountViews) < 0.2 ? (
              <span>
                Users are viewing account details but dropping off before clicking "Initiate Rental". Consider reviewing skin screenshots, adding more weapon bundles, or testing limited-time discounts on those accounts.
              </span>
            ) : funnel.initiateClicks > 0 && (funnel.completedBookings / funnel.initiateClicks) < 0.3 ? (
              <span>
                Users are initiating rentals but dropping off at the payment step. The 10-Minute Replacement Guarantee badge helps reduce this checkout hesitation.
              </span>
            ) : (
              <span>
                Your store traffic is healthy. Keep inventory stocked with popular bundles (like Kuronami & Champions) to maximize high-conversion rentals.
              </span>
            )}
          </div>
        </div>

      </div>

      {/* PER-ACCOUNT PERFORMANCE TABLE */}
      <div className="bg-brand-surface border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
              <Eye size={18} className="text-brand-accent" />
              Per-ID Performance (Which ID is Performing vs Lacking)
            </h3>
            <p className="text-xs text-slate-400">
              Detailed breakdown of view counts, rental initiates, and conversion health for each account
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-brand-dark border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:border-brand-accent outline-none"
            >
              <option value="views">Most Views</option>
              <option value="initiates">Most Initiates</option>
              <option value="conversion">Highest Conversion</option>
              <option value="name">Account Name</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-3">Account Name</th>
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">1h Rate</th>
                <th className="py-3 px-3 text-center">Views</th>
                <th className="py-3 px-3 text-center">Initiates</th>
                <th className="py-3 px-3 text-center">Paid Rentals</th>
                <th className="py-3 px-3 text-center">Conversion %</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {accountRows.map(row => (
                <tr key={row.account.id} className="hover:bg-white/[0.02] transition-colors">
                  
                  {/* Name & Thumbnail */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-black overflow-hidden border border-white/10 shrink-0">
                        <img src={row.account.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white uppercase tracking-tight">{row.account.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{row.account.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Rank */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-300">
                    {row.account.rank}
                  </td>

                  {/* 1h Rate */}
                  <td className="py-3 px-3 font-mono font-bold text-white">
                    ₹{row.account.pricing.hours1 || 80}/hr
                  </td>

                  {/* Views */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-brand-cyan">
                    <span className="px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/30">
                      {row.views}
                    </span>
                  </td>

                  {/* Initiates */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-yellow-400">
                    <span className="px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/30">
                      {row.initiates}
                    </span>
                  </td>

                  {/* Paid Bookings */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                    <span className="px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/30">
                      {row.bookings}
                    </span>
                  </td>

                  {/* Conversion */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-white">
                    {row.views > 0 ? `${row.conversionRate.toFixed(1)}%` : '0%'}
                  </td>

                  {/* Status Diagnostic */}
                  <td className="py-3 px-3 text-right">
                    {row.diagnosis === 'top' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <Flame size={10} /> Top Performer
                      </span>
                    ) : row.diagnosis === 'hesitant' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[10px] font-bold uppercase tracking-wider" title="High views but low rentals">
                        <AlertTriangle size={10} /> Needs Review
                      </span>
                    ) : row.diagnosis === 'quiet' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-500/20 border border-slate-500/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        Low Traffic
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Steady
                      </span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEVICE TELEMETRY & RECENT DAYS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Device Breakdown */}
        <div className="bg-brand-surface border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
          <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider mb-1 flex items-center gap-2">
            <Smartphone size={16} className="text-brand-cyan" />
            Device Breakdown
          </h3>
          <p className="text-xs text-slate-400 mb-6">Hardware platforms used by your visitors</p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                  <Smartphone size={14} className="text-brand-accent" /> Mobile Devices
                </span>
                <span className="font-mono text-white font-bold">{mobilePct}%</span>
              </div>
              <div className="w-full bg-brand-dark h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-brand-accent h-full rounded-full transition-all duration-500" style={{ width: `${mobilePct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                  <Monitor size={14} className="text-brand-cyan" /> Desktop & Laptops
                </span>
                <span className="font-mono text-white font-bold">{desktopPct}%</span>
              </div>
              <div className="w-full bg-brand-dark h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-brand-cyan h-full rounded-full transition-all duration-500" style={{ width: `${desktopPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day History Table */}
        <div className="lg:col-span-2 bg-brand-surface border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
          <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider mb-1 flex items-center gap-2">
            <Clock size={16} className="text-yellow-400" />
            Daily Traffic History (Last 7 Days)
          </h3>
          <p className="text-xs text-slate-400 mb-4">Daily visitor volume and engagement times</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Visitors</th>
                  <th className="py-2.5 px-3 text-center">Page Views</th>
                  <th className="py-2.5 px-3 text-center">Sessions</th>
                  <th className="py-2.5 px-3 text-right">Avg Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.values(analytics.dailyStats || {})
                  .slice(-7)
                  .reverse()
                  .map(day => (
                    <tr key={day.date} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">{day.date}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-brand-cyan font-bold">{day.uniqueVisitors}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">{day.pageViews}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-yellow-400">{day.sessions}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                        {formatDuration(day.sessions > 0 ? Math.round(day.totalTimeSeconds / day.sessions) : 0)}
                      </td>
                    </tr>
                  ))}
                {Object.keys(analytics.dailyStats || {}).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-mono text-xs">
                      No historical daily logs yet. Live traffic will record automatically as visitors browse.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminAnalyticsTab;
