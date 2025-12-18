
import { Account, Booking, Rank, BookingStatus, User, HomeConfig, Skin } from '../types';

const ACCOUNTS_KEY = 'kv_accounts';
const BOOKINGS_KEY = 'kv_bookings';
const USERS_KEY = 'kv_users';
const CURRENT_USER_KEY = 'kv_current_user';
const HOME_CONFIG_KEY = 'kv_home_config';

// 20 Minutes timeout for admin verification
const VERIFICATION_TIMEOUT_MS = 20 * 60 * 1000; 

// --- START PERMANENT DEFAULTS ---
// When you export from Admin, I can paste the JSON here to make it permanent for all users.
const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'KV-001',
    name: '58 PREMS & 10 BP',
    rank: Rank.PLATINUM,
    skins: [
      { name: 'Radiant Entertainment system Knife', isHighlighted: true },
      { name: 'Champs 22 Knife', isHighlighted: true },
      { name: 'Xenohunter Knife', isHighlighted: true },
      { name: 'Reaver Dagger', isHighlighted: false },
      { name: 'oni katana', isHighlighted: false },
      { name: 'Mystbloom Kunai', isHighlighted: false },
      { name: 'Neo frontier Axe', isHighlighted: false },
      { name: 'Araxys knife', isHighlighted: false },
      { name: 'Blade of serket', isHighlighted: false },
      { name: 'Sentinels of light knife', isHighlighted: false },
      { name: 'Divergence vandal', isHighlighted: false },
      { name: 'Exo Vandal', isHighlighted: false },
      { name: 'Araxys Vandal', isHighlighted: false },
      { name: 'Prelude Vandal', isHighlighted: false },
      { name: 'Reaver Vandal', isHighlighted: false },
      { name: 'Neptune Vandal', isHighlighted: false },
      { name: 'Xerofang vandal', isHighlighted: false },
      { name: 'Oni Vndal', isHighlighted: false }
    ],
    totalSkins: 18,
    description: 'Elite collection featuring the legendary Radiant Entertainment System Knife and full Vandal stack. High-tier lobbies and instant access.',
    pricing: { hours3: 49, hours12: 99, hours24: 149 },
    imageUrl: 'https://images.unsplash.com/photo-1624138784181-2999e930a9f7?q=80&w=1200&auto=format&fit=crop',
    isBooked: false,
    bookedUntil: null,
    username: 'kv_plat_001',
    password: 'Password123#'
  }
];

const DEFAULT_HOME_CONFIG: HomeConfig = {
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
    },
    {
      id: 2,
      type: 'text',
      name: 'Rahul K.',
      rank: 'Immortal',
      quote: 'Best service in India. Trusted and cheap rates compared to others.',
      rating: 5,
      date: '2 days ago'
    },
    {
      id: 3,
      type: 'video',
      name: 'Pratik Meshram',
      rank: 'Ascendant',
      quote: 'Check out this inventory! Totally worth the price.',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
    },
    {
      id: 4,
      type: 'text',
      name: 'Siddharth M.',
      rank: 'Gold',
      quote: 'Login was seamless. Will definitely rent again for my weekend streams.',
      rating: 5,
      date: '1 week ago'
    },
    {
      id: 5,
      type: 'text',
      name: 'Ishaan V.',
      rank: 'Platinum',
      quote: 'Support team on WhatsApp is very helpful. They helped me with the UPI scan issue immediately.',
      rating: 4,
      date: '3 days ago'
    }
  ],
  cta: {
    titleLine1: "Dont Just Play.",
    titleLine2: "DOMINATE.",
    subtitle: "Inventory updated every 24 hours. Grab your main before it's gone.",
    buttonText: "BROWSE ACCOUNTS"
  }
};
// --- END PERMANENT DEFAULTS ---

export const StorageService = {
  init: () => {
    if (!localStorage.getItem(ACCOUNTS_KEY)) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(INITIAL_ACCOUNTS));
    }
    if (!localStorage.getItem(BOOKINGS_KEY)) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(HOME_CONFIG_KEY)) {
      localStorage.setItem(HOME_CONFIG_KEY, JSON.stringify(DEFAULT_HOME_CONFIG));
    }
  },

  getAccounts: (): Account[] => {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    const bookingsData = localStorage.getItem(BOOKINGS_KEY);
    
    const rawAccounts: any[] = data ? JSON.parse(data) : [];
    const allBookings: Booking[] = bookingsData ? JSON.parse(bookingsData) : [];
    const now = new Date();
    
    return rawAccounts.map(acc => {
      // Migrate skins string[] to Skin[] if needed
      let formattedSkins: Skin[] = acc.skins.map((skin: any) => {
        if (typeof skin === 'string') {
          return { name: skin, isHighlighted: false };
        }
        return skin;
      });

      let processedAcc = { ...acc, skins: formattedSkins };

      if (processedAcc.isBooked) {
        if (processedAcc.bookedUntil && new Date(processedAcc.bookedUntil) < now) {
          processedAcc = { ...processedAcc, isBooked: false, bookedUntil: null };
        } 
        else {
          const latestBooking = allBookings.find(b => b.accountId === processedAcc.id && (b.status === BookingStatus.PENDING || b.status === BookingStatus.ACTIVE));
          
          if (latestBooking && latestBooking.status === BookingStatus.PENDING) {
             const createdTime = new Date(latestBooking.createdAt).getTime();
             const timeSinceCreation = now.getTime() - createdTime;
             
             if (timeSinceCreation > VERIFICATION_TIMEOUT_MS) {
                processedAcc = { ...processedAcc, isBooked: false, bookedUntil: null };
             }
          }
        }
      }
      
      return processedAcc;
    });
  },

  getAccountById: (id: string): Account | undefined => {
    return StorageService.getAccounts().find(a => a.id === id);
  },

  saveAccount: (account: Account) => {
    const accounts = StorageService.getAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    if (index >= 0) accounts[index] = account;
    else accounts.push(account);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    
    // Trigger storage event for cross-tab sync
    window.dispatchEvent(new Event('storage'));
  },

  deleteAccount: (id: string): Account[] => {
    const accounts = StorageService.getAccounts();
    const newAccounts = accounts.filter(a => a.id !== id);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(newAccounts));
    return newAccounts;
  },

  deleteAccounts: (ids: string[]): Account[] => {
    const accounts = StorageService.getAccounts();
    const newAccounts = accounts.filter(a => !ids.includes(a.id));
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(newAccounts));
    return newAccounts;
  },

  getBookings: (): Booking[] => {
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getUserBookings: (userId: string): Booking[] => {
    return StorageService.getBookings().filter(b => b.customerId === userId);
  },

  createBooking: (booking: Booking) => {
    const bookings = StorageService.getBookings();
    bookings.unshift(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    
    const accounts = StorageService.getAccounts();
    const accIndex = accounts.findIndex(a => a.id === booking.accountId);
    if (accIndex >= 0) {
      accounts[accIndex].isBooked = true;
      accounts[accIndex].bookedUntil = booking.endTime;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    window.dispatchEvent(new Event('storage'));
  },

  updateBookingStatus: (orderId: string, status: BookingStatus) => {
    const bookings = StorageService.getBookings();
    const booking = bookings.find(b => b.orderId === orderId);
    if (booking) {
      booking.status = status;
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
      
      if (status === BookingStatus.COMPLETED || status === BookingStatus.CANCELLED) {
        const accounts = StorageService.getAccounts();
        const accIndex = accounts.findIndex(a => a.id === booking.accountId);
        if (accIndex >= 0) {
          accounts[accIndex].isBooked = false;
          accounts[accIndex].bookedUntil = null;
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }
      
      if (status === BookingStatus.ACTIVE) {
        const accounts = StorageService.getAccounts();
        const accIndex = accounts.findIndex(a => a.id === booking.accountId);
        if (accIndex >= 0) {
          accounts[accIndex].isBooked = true;
          accounts[accIndex].bookedUntil = booking.endTime;
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }
      window.dispatchEvent(new Event('storage'));
    }
  },

  getHomeConfig: (): HomeConfig => {
    const data = localStorage.getItem(HOME_CONFIG_KEY);
    return data ? JSON.parse(data) : DEFAULT_HOME_CONFIG;
  },

  saveHomeConfig: (config: HomeConfig) => {
    localStorage.setItem(HOME_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('storage'));
  },

  // Added missing user management methods
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  logoutUser: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new Event('storage'));
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  registerUser: async (name: string, email: string, phone: string, password: string): Promise<User> => {
    const users = StorageService.getAllUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("User with this email already exists");
    }
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
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    window.dispatchEvent(new Event('storage'));
    return newUser;
  },

  loginUser: async (email: string, password: string): Promise<User> => {
    const users = StorageService.getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password");
    }
    user.lastLogin = new Date().toISOString();
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
    return user;
  }
};

StorageService.init();
