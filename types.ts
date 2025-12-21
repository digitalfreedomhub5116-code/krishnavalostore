
export enum Rank {
  IRON = 'Iron',
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
  DIAMOND = 'Diamond',
  ASCENDANT = 'Ascendant',
  IMMORTAL = 'Immortal',
  RADIANT = 'Radiant'
}

export interface Pricing {
  hours3: number;
  hours12: number;
  hours24: number;
}

export interface Skin {
  name: string;
  isHighlighted: boolean;
}

export interface Account {
  id: string;
  name: string;
  rank: Rank;
  skins: Skin[];
  totalSkins?: number; 
  initialSkinsCount?: number; 
  description?: string; 
  pricing: Pricing;
  imageUrl: string;
  isBooked: boolean;
  bookedUntil: string | null; 
  username?: string;
  password?: string;
}

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;         
  googleId?: string;   
  name: string;
  email: string;
  phone?: string;     
  password?: string;  
  avatarUrl: string;  
  role: UserRole;
  isVerified: boolean;
  verificationCode?: string;
  createdAt: string;  
  lastLogin: string;
  ultraPoints: number;
}

// Keeping Enum for reference values, but decoupling form Interface
export enum BookingStatus {
  PENDING = 'PENDING', 
  ACTIVE = 'ACTIVE',   
  PRE_BOOKED = 'PRE_BOOKED',
  COMPLETED = 'COMPLETED', 
  CANCELLED = 'CANCELLED'
}

export interface Booking {
  orderId: string;
  accountId: string;
  accountName: string;
  durationLabel: '3 Hours' | '12 Hours' | '24 Hours';
  hours: number;
  totalPrice: number;
  startTime: string; 
  endTime: string;   
  status: string; // Changed to pure string to fix TS2367
  customerName?: string;
  customerId?: string;
  createdAt: string;
  utr?: string;
}

export const UPI_ID = "8530085116@fam";

export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  accent: string;     
  buttonColor: string; 
}

export interface Review {
  id: number;
  type: 'video' | 'text';
  name: string;
  rank: string;
  quote: string;
  thumbnail?: string; // Video only
  videoUrl?: string;   // Video only
  rating?: number;    // Text only (1-5)
  date?: string;      // Text only
}

export interface TrustItem {
  label: string;
  sub: string;
}

export interface StepItem {
  title: string;
  desc: string;
}

export interface UltraPointsConfig {
  tagline: string;
  titlePart1: string;
  titleHighlight: string;
  titlePart2: string;
  description: string;
  card1Title: string;
  card1Desc: string;
  card2Title: string;
  card2Desc: string;
}

export interface HomeConfig {
  marqueeText: string[];
  heroSlides: HeroSlide[];
  trustItems: TrustItem[]; 
  stepItems: StepItem[];   
  reviews: Review[];
  ultraPoints?: UltraPointsConfig;
  cta: {
    titleLine1: string;
    titleLine2: string; 
    subtitle: string;
    buttonText: string;
  };
}
