export interface Variation {
  id: string;
  name: string;
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  image?: string;
  popular?: boolean;
  available?: boolean;
  variations?: Variation[];
  addOns?: AddOn[];
  // Discount pricing fields
  discountPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountActive?: boolean;
  // Computed effective price (calculated in the app)
  effectivePrice?: number;
  isOnDiscount?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedVariation?: Variation;
  selectedAddOns?: AddOn[];
  totalPrice: number;
}

export interface OrderLineItem {
  id: string;
  name: string;
  quantity: number;
  totalPrice: number;
  selectedVariation?: Variation;
  selectedAddOns?: AddOn[];
}

export interface OrderData {
  items: OrderLineItem[];
  customerName: string;
  contactNumber: string;
  serviceType: 'dine-in' | 'pickup';
  tableNumber?: string;
  paymentMethod: 'gcash' | 'maya' | 'bank-transfer';
  total: number;
  notes?: string;
  messengerPayload?: string;
  status?: OrderStatus;
}

export type PaymentMethod = 'gcash' | 'maya' | 'bank-transfer';
export type ServiceType = 'dine-in' | 'pickup';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order extends OrderData {
  id: string;
  orderCode: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
}

// Site Settings Types
export interface SiteSetting {
  id: string;
  value: string;
  type: 'text' | 'image' | 'boolean' | 'number';
  description?: string;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_logo: string;
  site_description: string;
  currency: string;
  currency_code: string;
}
