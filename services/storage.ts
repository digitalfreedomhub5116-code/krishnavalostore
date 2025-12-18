
import { createClient } from '@supabase/supabase-js';
import { Account, Booking, Rank, BookingStatus, User, HomeConfig, Skin } from '../types';

const SUPABASE_URL = 'https://akwdzwrkhpyhrrcyvkpx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EjqnCcOPSh6uoT9y-g2OFw_ACj0byDo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CURRENT_USER_KEY = 'kv_current_user';

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
  cta: {
    titleLine1: "Dont Just Play.",
    titleLine2: "DOMINATE.",
    subtitle: "Inventory updated every 24 hours. Grab your main before it's gone.",
    buttonText: "VIEW LIVE INVENTORY"
  }
};

export const StorageService = {
  getAccounts: async (): Promise<Account[]> => {
    const { data, error } = await supabase.from('accounts').select('*');
    if (error || !data) return [];
    return data.map(row => row.data as Account);
  },

  getAccountById: async (id: string): Promise<Account | undefined> => {
    const { data, error } = await supabase.from('accounts').select('data').eq('id', id).single();
    if (error || !data) return undefined;
    return data.data as Account;
  },

  saveAccount: async (account: Account) => {
    await supabase.from('accounts').upsert({ id: account.id, data: account });
    window.dispatchEvent(new Event('storage'));
  },

  deleteAccount: async (id: string) => {
    await supabase.from('accounts').delete().eq('id', id);
    window.dispatchEvent(new Event('storage'));
  },

  getBookings: async (): Promise<Booking[]> => {
    const { data, error } = await supabase.from('bookings').select('*').order('data->createdAt', { ascending: false });
    if (error || !data) return [];
    return data.map(row => row.data as Booking);
  },

  getUserBookings: async (userId: string): Promise<Booking[]> => {
    const bookings = await StorageService.getBookings();
    return bookings.filter(b => b.customerId === userId);
  },

  createBooking: async (booking: Booking) => {
    await supabase.from('bookings').upsert({ order_id: booking.orderId, data: booking, status: booking.status });
    window.dispatchEvent(new Event('storage'));
  },

  updateBookingStatus: async (orderId: string, status: BookingStatus) => {
    const { data: row } = await supabase.from('bookings').select('data').eq('order_id', orderId).single();
    if (row?.data) {
      const booking = row.data as Booking;
      booking.status = status;
      await supabase.from('bookings').update({ data: booking, status: status }).eq('order_id', orderId);
      window.dispatchEvent(new Event('storage'));
    }
  },

  getHomeConfig: async (): Promise<HomeConfig> => {
    try {
      const { data, error } = await supabase.from('home_config').select('data').eq('id', 'global').single();
      if (error || !data?.data) return DEFAULT_HOME_CONFIG;
      
      const config = data.data as HomeConfig;
      // Deep merge to ensure all sections exist
      return {
        ...DEFAULT_HOME_CONFIG,
        ...config,
        trustItems: config.trustItems && config.trustItems.length > 0 ? config.trustItems : DEFAULT_HOME_CONFIG.trustItems,
        heroSlides: config.heroSlides && config.heroSlides.length > 0 ? config.heroSlides : DEFAULT_HOME_CONFIG.heroSlides,
        marqueeText: config.marqueeText && config.marqueeText.length > 0 ? config.marqueeText : DEFAULT_HOME_CONFIG.marqueeText,
        stepItems: config.stepItems && config.stepItems.length > 0 ? config.stepItems : DEFAULT_HOME_CONFIG.stepItems,
        reviews: config.reviews && config.reviews.length > 0 ? config.reviews : DEFAULT_HOME_CONFIG.reviews,
        cta: config.cta || DEFAULT_HOME_CONFIG.cta
      };
    } catch {
      return DEFAULT_HOME_CONFIG;
    }
  },

  saveHomeConfig: async (config: HomeConfig) => {
    const { error } = await supabase.from('home_config').upsert({ id: 'global', data: config });
    if (error) throw error;
    window.dispatchEvent(new Event('storage'));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  logoutUser: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new Event('storage'));
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('data');
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
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    await supabase.from('users').insert({ id: newUser.id, email: newUser.email, data: newUser });
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    window.dispatchEvent(new Event('storage'));
    return newUser;
  },

  loginUser: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.from('users').select('data').eq('email', email).single();
    if (error || !data) throw new Error("Invalid credentials");
    const user = data.data as User;
    if (user.password !== password) throw new Error("Invalid credentials");
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
    return user;
  }
};
