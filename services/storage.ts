

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Account, Booking, Rank, BookingStatus, User, HomeConfig, Skin } from '../types';

const SUPABASE_URL = 'https://akwdzwrkhpyhrrcyvkpx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EjqnCcOPSh6uoT9y-g2OFw_ACj0byDo';

// Lazy load Supabase to avoid constructor issues at module-level load
let supabaseInstance: SupabaseClient | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseInstance;
};

const CURRENT_USER_KEY = 'kv_current_user';

// Internal listener system to avoid manual Event constructor usage
type StorageListener = () => void;
const listeners = new Set<StorageListener>();

const notifyStorageChange = () => {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      // Ignore listener errors
    }
  });

  try {
    localStorage.setItem('valo_storage_sync', Date.now().toString());
  } catch (e) {
    // Ignore storage errors
  }
};

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  marqueeText: [
    "⚡ NEW RADIANT BUNDLES ADDED TO INVENTORY",
    "🔥 GET 10% OFF ON ALL 24-HOUR RENTALS",
    "🛡️ VANGUARD BYPASS SECURED - 0% BAN RATE",
    "⚡ INSTANT CREDENTIAL DELIVERY VIA WHATSAPP",
    "🏆 TRUSTED BY 5000+ PREMIUM AGENTS"
  ],
  heroSlides: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
      title: "UNLEASH RADIANT POWER",
      subtitle: "Dominate the lobby with 50+ premium skins and verified immortal MMR.",
      accent: "text-brand-accent",
      buttonColor: "bg-brand-accent hover:bg-red-600"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop",
      title: "INSTANT DEPLOYMENT",
      subtitle: "Get credentials delivered to your WhatsApp in under 120 seconds.",
      accent: "text-brand-cyan",
      buttonColor: "bg-brand-cyan hover:bg-cyan-400 text-brand-darker"
    }
  ],
  trustItems: [
    { label: "Instant", sub: "Auto-Delivery" },
    { label: "Secure", sub: "Anti-Ban Tech" },
    { label: "Cheap", sub: "Starts ₹49" },
    { label: "Elite", sub: "Verified MMR" }
  ],
  stepItems: [
    { title: "SELECT AGENT", desc: "Browse our premium inventory." },
    { title: "CHOOSE TIME", desc: "Pick 3h, 12h, or 24h plans." },
    { title: "SECURE PAY", desc: "Scan QR and enter UTR ID." },
    { title: "PLAY NOW", desc: "Get details on WhatsApp." }
  ],
  reviews: [
    {
      id: 1,
      type: 'video',
      name: 'Aryan Sharma',
      rank: 'Diamond',
      quote: 'Got the ID in 2 minutes. The Radiant knife skin is insane!',
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1000&auto=format&fit=crop',
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
    }
  ],
  ultraPoints: {
    tagline: "NEW REWARDS PROTOCOL",
    titlePart1: "EARN",
    titleHighlight: "ULTRA POINTS",
    titlePart2: "WHILE YOU PLAY",
    description: "Join the most rewarding rental ecosystem. Every deployment earns you points that convert directly into Valorant Points (VP) for your main account.",
    card1Title: "Earn 1 UP for ₹9",
    card1Desc: "Simply rent any ID. Points are calculated as Amount / 9 and added on approval.",
    card2Title: "1 UP = 2 VP",
    card2Desc: "Your earned points double in value when converting to Valorant Point vouchers."
  },
  cta: {
    titleLine1: "Dont Just Play.",
    titleLine2: "DOMINATE.",
    subtitle: "Inventory updated every 24 hours. Grab your main before it's gone.",
    buttonText: "VIEW LIVE INVENTORY"
  }
};

export const StorageService = {
  subscribe: (callback: StorageListener) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getAccounts: async (): Promise<Account[]> => {
    const { data, error } = await getSupabase().from('accounts').select('*');
    if (error || !data) return [];
    return data.map(row => row.data as Account);
  },

  getAccountById: async (id: string): Promise<Account | undefined> => {
    const { data, error } = await getSupabase().from('accounts').select('data').eq('id', id).single();
    if (error || !data) return undefined;
    return data.data as Account;
  },

  saveAccount: async (account: Account) => {
    await getSupabase().from('accounts').upsert({ id: account.id, data: account });
    notifyStorageChange();
  },

  deleteAccount: async (id: string) => {
    await getSupabase().from('accounts').delete().eq('id', id);
    notifyStorageChange();
  },

  getBookings: async (): Promise<Booking[]> => {
    const { data, error } = await getSupabase().from('bookings').select('*').order('data->createdAt', { ascending: false });
    if (error || !data) return [];
    return data.map(row => row.data as Booking);
  },

  getUserBookings: async (userId: string): Promise<Booking[]> => {
    const bookings = await StorageService.getBookings();
    return bookings.filter(b => b.customerId === userId);
  },

  createBooking: async (booking: Booking) => {
    await getSupabase().from('bookings').upsert({ order_id: booking.orderId, data: booking, status: booking.status });
    notifyStorageChange();
  },

  updateBookingStatus: async (orderId: string, status: BookingStatus) => {
    const { data: row } = await getSupabase().from('bookings').select('data').eq('order_id', orderId).single();
    
    if (row?.data) {
      const booking = row.data as Booking;
      const oldStatus = booking.status;
      booking.status = status;
      
      await getSupabase().from('bookings').update({ data: booking, status: status }).eq('order_id', orderId);
      
      // Points Logic
      if (booking.customerId) {
        const points = Math.floor(booking.totalPrice / 9);
        
        // Mark as active (Approved) -> Add points
        if (oldStatus !== BookingStatus.ACTIVE && status === BookingStatus.ACTIVE) {
          await StorageService.updateUserPoints(booking.customerId, points);
        } 
        // Marked as cancelled -> Deduct points (if they were already added)
        else if (oldStatus === BookingStatus.ACTIVE && status === BookingStatus.CANCELLED) {
          await StorageService.updateUserPoints(booking.customerId, -points);
        }
      }

      const account = await StorageService.getAccountById(booking.accountId);
      
      if (account) {
        if (status === BookingStatus.ACTIVE) {
          account.isBooked = true;
          account.bookedUntil = booking.endTime;
          await StorageService.saveAccount(account);
        } else if (status === BookingStatus.COMPLETED || status === BookingStatus.CANCELLED) {
          account.isBooked = false;
          account.bookedUntil = null;
          await StorageService.saveAccount(account);
        }
      }
      
      notifyStorageChange();
    }
  },

  updateUserPoints: async (userId: string, amount: number) => {
    const { data: row } = await getSupabase().from('users').select('data').eq('id', userId).single();
    if (row?.data) {
      const userData = row.data as User;
      userData.ultraPoints = (userData.ultraPoints || 0) + amount;
      
      await getSupabase().from('users').update({ data: userData }).eq('id', userId);
      
      // Update local storage if this is the current user
      const currentUser = StorageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      }
      notifyStorageChange();
    }
  },

  getHomeConfig: async (): Promise<HomeConfig> => {
    try {
      const { data, error } = await getSupabase().from('home_config').select('data').eq('id', 'global').single();
      if (error || !data?.data) return DEFAULT_HOME_CONFIG;
      
      const config = data.data as HomeConfig;
      return {
        ...DEFAULT_HOME_CONFIG,
        ...config,
        trustItems: config.trustItems && config.trustItems.length > 0 ? config.trustItems : DEFAULT_HOME_CONFIG.trustItems,
        heroSlides: config.heroSlides && config.heroSlides.length > 0 ? config.heroSlides : DEFAULT_HOME_CONFIG.heroSlides,
        marqueeText: config.marqueeText && config.marqueeText.length > 0 ? config.marqueeText : DEFAULT_HOME_CONFIG.marqueeText,
        stepItems: config.stepItems && config.stepItems.length > 0 ? config.stepItems : DEFAULT_HOME_CONFIG.stepItems,
        reviews: config.reviews && config.reviews.length > 0 ? config.reviews : DEFAULT_HOME_CONFIG.reviews,
        ultraPoints: config.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints,
        cta: config.cta || DEFAULT_HOME_CONFIG.cta
      };
    } catch {
      return DEFAULT_HOME_CONFIG;
    }
  },

  saveHomeConfig: async (config: HomeConfig) => {
    const { error } = await getSupabase().from('home_config').upsert({ id: 'global', data: config });
    if (error) throw error;
    notifyStorageChange();
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  logoutUser: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    notifyStorageChange();
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await getSupabase().from('users').select('data');
    if (error || !data) return [];
    return data.map(row => row.data as User);
  },

  registerUser: async (name: string, email: string, phone: string, password: string): Promise<User> => {
    const newUser: User = {
      id: 'usr-' + Date.now(),
      name, email, phone, password,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      role: 'customer',
      isVerified: true,
      ultraPoints: 20, // Welcome Bonus
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    await getSupabase().from('users').insert({ id: newUser.id, email: newUser.email, data: newUser });
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    notifyStorageChange();
    return newUser;
  },

  loginUser: async (email: string, password: string): Promise<User> => {
    const { data, error } = await getSupabase().from('users').select('data').eq('email', email).single();
    if (error || !data) throw new Error("Invalid credentials");
    const user = data.data as User;
    if (user.password !== password) throw new Error("Invalid credentials");
    
    user.lastLogin = new Date().toISOString();
    await getSupabase().from('users').update({ data: user }).eq('id', user.id);
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    notifyStorageChange();
    return user;
  }
};
