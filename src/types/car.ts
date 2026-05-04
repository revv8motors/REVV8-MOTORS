export interface Car {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number | string;
  showPrice?: boolean;
  discountedPrice?: number | string | null;
  isOnOffer?: boolean;
  offerText?: string | null;
  priceBadge?: 'NONE' | 'HOT_DEAL' | 'LIMITED_OFFER';
  
  isCertified?: boolean;
  isPremium?: boolean;
  warrantyAvailable?: boolean;
  inspectionPassed?: boolean;

  metaTitle?: string | null;
  metaDescription?: string | null;
  slug?: string;

  status?: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'COMING_SOON';
  publishAt?: string | null;
  expiryDate?: string | null;

  mileage: number;
  fuel: string;
  transmission: string;
  category: string;
  engine: string | null;
  ownership: string | null;
  description: string | null;
  images: string[];
  featured: boolean;
  published: boolean;
  archived?: boolean;
  created_at: string;
  updated_at: string;
}

export const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"] as const;
export const TRANSMISSIONS = ["Automatic", "Manual", "PDK", "DCT"] as const;
export const CATEGORIES = ["Sedan", "SUV", "Sports", "Electric", "Coupe", "Convertible"] as const;
export const STATUSES = ["AVAILABLE", "SOLD", "RESERVED", "COMING_SOON"] as const;
export const PRICE_BADGES = ["NONE", "HOT_DEAL", "LIMITED_OFFER"] as const;
