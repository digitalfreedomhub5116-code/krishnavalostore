import { createClient } from '@supabase/supabase-js';
import { Account, Booking, Rank, BookingStatus, User, HomeConfig, Skin } from '../types';

const SUPABASE_URL = 'https://akwdzwrkhpyhrrcyvkpx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EjqnCcOPSh6uoT9y-g2OFw_ACj0byDo';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CURRENT_USER_KEY = 'kv_current_user';

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  marqueeText: [
    "⚡ NEW SKINS ADDED: RADIANT ENTERTAINMENT SYSTEM",
    "🔥 FLAT 10% OFF ON 24H RENTALS",
    "🛡️ 100% BAN PROOF ACCOUNTS",
    "⚡ INSTANT WHATSAPP DELIVERY"
  ],
  heroSlides: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
      title: "UNLEASH RADIANT POWER",
      subtitle: "Dominate the lobby with 58 premium skins.",
      accent: "text-brand-accent",
      buttonColor: "bg-brand-accent hover:bg-red-600"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop",
      title: "INSTANT ACCESS SECURED",
      subtitle: "Get credentials delivered to your WhatsApp in seconds.",
      accent: "text-brand-cyan",
      buttonColor: "bg-brand-cyan hover:bg-cyan-400 text-brand-darker"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1538370910416-0411a7ee2188?q=80&w=2670&auto=format&fit=crop",
      title: "PREMIUM INVENTORY ONLY",
      subtitle: "Verified Immortal and Ascendant IDs with rare knife bundles.",
      accent: "text-brand-secondary",
      buttonColor: "bg-brand-secondary hover:bg-purple-600 text-white"
    }
  ],
  trustItems: [
    { label: "Instant", sub: "Auto-Delivery" },
    { label: "Secure", sub: "No-Ban Policy" },
    { label: "Cheap", sub: "From ₹49" },
    { label: "Premium", sub: "Top Skins" }
  ],
  stepItems: [
    { title: "SELECT ID", desc: "Browse inventory." },
    { title: "SET TIME", desc: "3h / 12h / 24h." },
    { title: "SCAN QR", desc: "UPI Payment." },
    { title: "PLAY NOW", desc: "Credentials via WA." }
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
    buttonText: "BROWSE ACCOUNTS"
  }
};

export const StorageService = {
  init: async () => {
    await StorageService.getHomeConfig();
  },

  // --- Accounts ---
  getAccounts: async (): Promise<Account[]> => {
    const { data, error } = await supabase.from('accounts').select('*');
    if (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
    
    const now = new Date();
    return (data as any[]).map(row => {
      const acc = row.data as Account;
      if (acc.isBooked && acc.bookedUntil && new Date(acc.bookedUntil) < now) {
        acc.isBooked = false;
        acc.bookedUntil = null;
        StorageService.saveAccount(acc);
      }
      return acc;
    });
  },

  getAccountById: async (id: string): Promise<Account | undefined> => {
    const { data, error } = await supabase.from('accounts').select('data').eq('id', id).single();
    if (error) return undefined;
    return data.data as Account;
  },

  saveAccount: async (account: Account) => {
    const { error } = await supabase.from('accounts').upsert({
      id: account.id,
      data: account
    });
    if (error) console.error('Error saving account:', error);
    window.dispatchEvent(new Event('storage'));
  },

  deleteAccount: async (id: string) => {
    await supabase.from('accounts').delete().eq('id', id);
    window.dispatchEvent(new Event('storage'));
  },

  deleteAccounts: async (ids: string[]) => {
    await supabase.from('accounts').delete().in('id', ids);
    window.dispatchEvent(new Event('storage'));
  },

  // --- Bookings ---
  getBookings: async (): Promise<Booking[]> => {
    const { data, error } = await supabase.from('bookings').select('*').order('data->createdAt', { ascending: false });
    if (error) return [];
    return (data as any[]).map(row => row.data as Booking);
  },

  getUserBookings: async (userId: string): Promise<Booking[]> => {
    const bookings = await StorageService.getBookings();
    return bookings.filter(b => b.customerId === userId);
  },

  createBooking: async (booking: Booking) => {
    await supabase.from('bookings').upsert({
      order_id: booking.orderId,
      data: booking,
      status: booking.status
    });
    
    const acc = await StorageService.getAccountById(booking.accountId);
    if (acc) {
      acc.isBooked = true;
      acc.bookedUntil = booking.endTime;
      await StorageService.saveAccount(acc);
    }
    window.dispatchEvent(new Event('storage'));
  },

  updateBookingStatus: async (orderId: string, status: BookingStatus) => {
    const { data: bookingRow } = await supabase.from('bookings').select('data').eq('order_id', orderId).single();
    if (bookingRow) {
      const booking = bookingRow.data as Booking;
      booking.status = status;
      
      await supabase.from('bookings').update({ 
        data: booking, 
        status: status 
      }).eq('order_id', orderId);
      
      if (status === BookingStatus.COMPLETED || status === BookingStatus.CANCELLED) {
        const acc = await StorageService.getAccountById(booking.accountId);
        if (acc) {
          acc.isBooked = false;
          acc.bookedUntil = null;
          await StorageService.saveAccount(acc);
        }
      }
      
      if (status === BookingStatus.ACTIVE) {
        const acc = await StorageService.getAccountById(booking.accountId);
        if (acc) {
          acc.isBooked = true;
          acc.bookedUntil = booking.endTime;
          await StorageService.saveAccount(acc);
        }
      }
      window.dispatchEvent(new Event('storage'));
    }
  },

  // --- Home Config ---
  getHomeConfig: async (): Promise<HomeConfig> => {
    const { data, error } = await supabase.from('home_config').select('data').eq('id', 'global').single();
    if (error || !data || !data.data || (data.data.heroSlides && data.data.heroSlides.length === 0)) {
      return DEFAULT_HOME_CONFIG;
    }
    return data.data as HomeConfig;
  },

  saveHomeConfig: async (config: HomeConfig) => {
    await supabase.from('home_config').upsert({
      id: 'global',
      data: config
    });
    window.dispatchEvent(new Event('storage'));
  },

  // --- Users ---
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
    if (error) return [];
    return (data as any[]).map(row => row.data as User);
  },

  registerUser: async (name: string, email: string, phone: string, password: string): Promise<User> => {
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) throw new Error("User already exists");

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name,
      email,
      phone,
      password,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      role: 'customer',
      isVerified: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await supabase.from('users').insert({
      id: newUser.id,
      email: newUser.email,
      data: newUser
    });
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    window.dispatchEvent(new Event('storage'));
    return newUser;
  },

  loginUser: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.from('users').select('data').eq('email', email).single();
    if (error || !data) throw new Error("Invalid credentials");
    
    const user = data.data as User;
    if (user.password !== password) throw new Error("Invalid credentials");

    user.lastLogin = new Date().toISOString();
    await supabase.from('users').update({ data: user }).eq('id', user.id);

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
    return user;
  }
};
