export type User = {
  id: string;
  email: string | null;
  password?: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  sid: string;
  sess: any;
  expire: Date;
};

export type Property = {
  id: string;
  propertyType: string | null;
  address: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  sqFt: number | null;
  beds: number | null;
  baths: number | null;
  estValue: number | null;
  estEquity: number | null;
  owner: string | null;
  ownerOccupied: string | null;
  listedForSale: string | null;
  foreclosure: string | null;
  attomStatus: string;
  attomMarketValue: number | null;
  attomAssessedValue: number | null;
  attomYearBuilt: number | null;
  attomBldgSize: number | null;
  attomBeds: number | null;
  attomBaths: number | null;
  attomLotSize: number | null;
  attomPropClass: string | null;
  attomLastSalePrice: number | null;
  attomLastSaleDate: string | null;
  attomData: any;
  attomError: string | null;
  attomAvmValue: number | null;
  attomAvmHigh: number | null;
  attomAvmLow: number | null;
  attomAvmConfidence: number | null;
  attomTaxAmount: number | null;
  attomTaxYear: number | null;
  annualTaxes: number | null;
  annualInsurance: number | null;
  monthlyHoa: number | null;
  attomSyncedAt: Date | null;
  rentcastStatus: string;
  rentcastValueEstimate: number | null;
  rentcastValueLow: number | null;
  rentcastValueHigh: number | null;
  rentcastRentEstimate: number | null;
  rentcastRentLow: number | null;
  rentcastRentHigh: number | null;
  rentcastPropertyData: any;
  rentcastTaxHistory: any;
  rentcastSaleComps: any;
  rentcastRentComps: any;
  rentcastMarketData: any;
  rentcastError: string | null;
  rentcastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LoanApplication = {
  id: string;
  loanType: string;
  propertyType: string;
  address: string | null;
  purchasePrice: number;
  estimatedValue: number;
  downPayment: number;
  loanAmount: number;
  creditScore: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  preferredContact: string | null;
  preferredCallTime: string | null;
  agreeMarketing: string | null;
  documents: any;
  attomData: any;
  submittedAt: Date;
  updatedAt: Date;
};

export type PropertyListing = {
  id: string;
  propertyId: string;
  ownerUserId: string;
  status: string;
  listPrice: number | null;
  description: string | null;
  terms: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PropertyWatchlist = {
  id: string;
  userId: string;
  listingId: string;
  createdAt: Date;
};

export type PropertyOffer = {
  id: string;
  listingId: string;
  buyerUserId: string;
  offerAmount: number;
  status: string;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PropertyAlert = {
  id: string;
  userId: string;
  name: string;
  isActive: string;
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  maxBeds: number | null;
  minBaths: number | null;
  maxBaths: number | null;
  minSqFt: number | null;
  maxSqFt: number | null;
  propertyTypes: string[] | null;
  cities: string[] | null;
  states: string[] | null;
  postalCodes: string[] | null;
  keywords: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  rating?: number;
  services?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type PropertyFavorite = {
  id: string;
  propertyId: string;
  sessionId: string;
  createdAt: Date;
};
