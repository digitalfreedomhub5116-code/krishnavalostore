import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnalyticsSummary, DailyAnalytics, AccountAnalytics } from '../types';

const SUPABASE_URL = 'https://akwdzwrkhpyhrrcyvkpx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EjqnCcOPSh6uoT9y-g2OFw_ACj0byDo';

let supabaseInstance: SupabaseClient | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseInstance;
};

const ANALYTICS_CONFIG_ID = 'analytics_summary';

export const DEFAULT_ANALYTICS_SUMMARY: AnalyticsSummary = {
  totalPageViews: 0,
  totalVisitors: 0,
  totalTimeSpentSeconds: 0,
  totalSessions: 0,
  funnel: {
    siteVisits: 0,
    accountViews: 0,
    initiateClicks: 0,
    checkoutViews: 0,
    completedBookings: 0
  },
  accountStats: {},
  dailyStats: {}
};

// In-memory buffer of unsaved metrics to batch updates and prevent excessive DB calls
interface AnalyticsBuffer {
  pageViews: number;
  timeSpentSeconds: number;
  isNewVisitorToday: boolean;
  isNewSession: boolean;
  isMobile: boolean;
  funnelIncrements: {
    siteVisits: number;
    accountViews: number;
    initiateClicks: number;
    checkoutViews: number;
    completedBookings: number;
  };
  accountIncrements: Record<string, { views: number; initiates: number; bookings: number }>;
}

let buffer: AnalyticsBuffer = {
  pageViews: 0,
  timeSpentSeconds: 0,
  isNewVisitorToday: false,
  isNewSession: false,
  isMobile: false,
  funnelIncrements: {
    siteVisits: 0,
    accountViews: 0,
    initiateClicks: 0,
    checkoutViews: 0,
    completedBookings: 0
  },
  accountIncrements: {}
};

let flushTimer: NodeJS.Timeout | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;
let isInitialized = false;

const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const AnalyticsService = {
  // Fetch current aggregated analytics summary from Supabase
  getSummary: async (): Promise<AnalyticsSummary> => {
    try {
      const { data, error } = await getSupabase()
        .from('home_config')
        .select('data')
        .eq('id', ANALYTICS_CONFIG_ID)
        .single();

      if (error || !data?.data) {
        return DEFAULT_ANALYTICS_SUMMARY;
      }
      return {
        ...DEFAULT_ANALYTICS_SUMMARY,
        ...data.data,
        funnel: { ...DEFAULT_ANALYTICS_SUMMARY.funnel, ...(data.data.funnel || {}) },
        accountStats: data.data.accountStats || {},
        dailyStats: data.data.dailyStats || {}
      };
    } catch (e) {
      console.error('Failed to get analytics summary:', e);
      return DEFAULT_ANALYTICS_SUMMARY;
    }
  },

  // Initialize tracking for user session & active time
  init: () => {
    if (isInitialized || typeof window === 'undefined') return;
    isInitialized = true;

    const today = getTodayKey();
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    buffer.isMobile = isMobile;

    // Check Unique Visitor (LocalStorage)
    const visitorId = localStorage.getItem('kv_visitor_id');
    const lastVisitDate = localStorage.getItem('kv_last_visit_date');
    if (!visitorId || lastVisitDate !== today) {
      localStorage.setItem('kv_visitor_id', visitorId || 'v_' + Math.random().toString(36).substring(2, 9));
      localStorage.setItem('kv_last_visit_date', today);
      buffer.isNewVisitorToday = true;
    }

    // Check Session (SessionStorage)
    const sessionId = sessionStorage.getItem('kv_session_id');
    if (!sessionId) {
      sessionStorage.setItem('kv_session_id', 's_' + Date.now());
      buffer.isNewSession = true;
    }

    // Active Browsing Heartbeat (every 5 seconds while tab is focused)
    heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        buffer.timeSpentSeconds += 5;
      }
    }, 5000);

    // Schedule periodic database flush every 25 seconds
    flushTimer = setInterval(() => {
      AnalyticsService.flush();
    }, 25000);

    // Flush on page unload/hide
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        AnalyticsService.flush();
      }
    });

    window.addEventListener('pagehide', () => {
      AnalyticsService.flush();
    });
  },

  // Record a page view
  trackPageView: (path: string, accountId?: string) => {
    AnalyticsService.init();
    buffer.pageViews += 1;

    if (accountId) {
      buffer.funnelIncrements.accountViews += 1;
      if (!buffer.accountIncrements[accountId]) {
        buffer.accountIncrements[accountId] = { views: 0, initiates: 0, bookings: 0 };
      }
      buffer.accountIncrements[accountId].views += 1;
    } else if (path === '/' || path === '/browse') {
      buffer.funnelIncrements.siteVisits += 1;
    }
  },

  // Record "Initiate Rental" click
  trackInitiateRental: (accountId: string) => {
    AnalyticsService.init();
    buffer.funnelIncrements.initiateClicks += 1;
    if (!buffer.accountIncrements[accountId]) {
      buffer.accountIncrements[accountId] = { views: 0, initiates: 0, bookings: 0 };
    }
    buffer.accountIncrements[accountId].initiates += 1;
    // Flush immediately so admin sees real-time conversions
    AnalyticsService.flush();
  },

  // Record Checkout page view
  trackCheckoutView: () => {
    AnalyticsService.init();
    buffer.funnelIncrements.checkoutViews += 1;
    AnalyticsService.flush();
  },

  // Record Payment / Booking completed
  trackBookingCompleted: (accountId: string) => {
    AnalyticsService.init();
    buffer.funnelIncrements.completedBookings += 1;
    if (!buffer.accountIncrements[accountId]) {
      buffer.accountIncrements[accountId] = { views: 0, initiates: 0, bookings: 0 };
    }
    buffer.accountIncrements[accountId].bookings += 1;
    AnalyticsService.flush();
  },

  // Flush in-memory buffer to Supabase
  flush: async () => {
    // If nothing changed, skip
    const hasDataToFlush =
      buffer.pageViews > 0 ||
      buffer.timeSpentSeconds > 0 ||
      buffer.isNewVisitorToday ||
      buffer.isNewSession ||
      buffer.funnelIncrements.siteVisits > 0 ||
      buffer.funnelIncrements.accountViews > 0 ||
      buffer.funnelIncrements.initiateClicks > 0 ||
      buffer.funnelIncrements.checkoutViews > 0 ||
      buffer.funnelIncrements.completedBookings > 0 ||
      Object.keys(buffer.accountIncrements).length > 0;

    if (!hasDataToFlush) return;

    // Snapshot current buffer & reset immediately
    const snap = { ...buffer };
    buffer = {
      pageViews: 0,
      timeSpentSeconds: 0,
      isNewVisitorToday: false,
      isNewSession: false,
      isMobile: snap.isMobile,
      funnelIncrements: { siteVisits: 0, accountViews: 0, initiateClicks: 0, checkoutViews: 0, completedBookings: 0 },
      accountIncrements: {}
    };

    try {
      const today = getTodayKey();
      const current = await AnalyticsService.getSummary();

      // Update Top-level totals
      current.totalPageViews = (current.totalPageViews || 0) + snap.pageViews;
      current.totalTimeSpentSeconds = (current.totalTimeSpentSeconds || 0) + snap.timeSpentSeconds;
      if (snap.isNewVisitorToday) {
        current.totalVisitors = (current.totalVisitors || 0) + 1;
      }
      if (snap.isNewSession) {
        current.totalSessions = (current.totalSessions || 0) + 1;
      }

      // Update Funnel
      current.funnel = {
        siteVisits: (current.funnel.siteVisits || 0) + snap.funnelIncrements.siteVisits,
        accountViews: (current.funnel.accountViews || 0) + snap.funnelIncrements.accountViews,
        initiateClicks: (current.funnel.initiateClicks || 0) + snap.funnelIncrements.initiateClicks,
        checkoutViews: (current.funnel.checkoutViews || 0) + snap.funnelIncrements.checkoutViews,
        completedBookings: (current.funnel.completedBookings || 0) + snap.funnelIncrements.completedBookings
      };

      // Update Daily Stats
      if (!current.dailyStats) current.dailyStats = {};
      const dayRecord: DailyAnalytics = current.dailyStats[today] || {
        date: today,
        uniqueVisitors: 0,
        pageViews: 0,
        totalTimeSeconds: 0,
        sessions: 0,
        deviceMobile: 0,
        deviceDesktop: 0
      };

      if (snap.isNewVisitorToday) dayRecord.uniqueVisitors += 1;
      if (snap.isNewSession) {
        dayRecord.sessions += 1;
        if (snap.isMobile) {
          dayRecord.deviceMobile += 1;
        } else {
          dayRecord.deviceDesktop += 1;
        }
      }
      dayRecord.pageViews += snap.pageViews;
      dayRecord.totalTimeSeconds += snap.timeSpentSeconds;
      current.dailyStats[today] = dayRecord;

      // Update Per-Account Stats
      if (!current.accountStats) current.accountStats = {};
      for (const [accId, inc] of Object.entries(snap.accountIncrements)) {
        const accRecord: AccountAnalytics = current.accountStats[accId] || {
          views: 0,
          initiates: 0,
          bookings: 0
        };
        accRecord.views += inc.views;
        accRecord.initiates += inc.initiates;
        accRecord.bookings += inc.bookings;
        accRecord.lastViewedAt = new Date().toISOString();
        current.accountStats[accId] = accRecord;
      }

      current.updatedAt = new Date().toISOString();

      // Upsert back to Supabase
      await getSupabase().from('home_config').upsert({
        id: ANALYTICS_CONFIG_ID,
        data: current
      });
    } catch (err) {
      console.error('Failed to flush analytics to Supabase:', err);
    }
  },

  // Reset analytics (Admin utility)
  resetSummary: async () => {
    await getSupabase().from('home_config').upsert({
      id: ANALYTICS_CONFIG_ID,
      data: DEFAULT_ANALYTICS_SUMMARY
    });
  }
};
