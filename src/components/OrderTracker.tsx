import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { OrderLineItem, OrderStatus } from '../types';
import { Loader2, Search, ArrowLeft } from 'lucide-react';

interface OrderTrackerProps {
  onBack: () => void;
  initialCode?: string | null;
}

interface TrackedOrder {
  order_code: string;
  customer_name: string;
  service_type: string;
  status: OrderStatus;
  total: number;
  tip?: number;
  table_number?: string;
  pickup_time?: string;
  created_at: string;
  updated_at: string;
  line_items: OrderLineItem[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusBadgeClass = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
    case 'confirmed':
      return 'bg-sky-500/20 text-sky-300 border border-sky-500/40';
    case 'preparing':
      return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
    case 'ready':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-300 border border-red-500/40';
    default:
      return 'bg-white/10 text-alchemy-cream border border-white/20';
  }
};

const OrderTracker: React.FC<OrderTrackerProps> = ({ onBack, initialCode }) => {
  const [inputCode, setInputCode] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderStatus = React.useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    setOrder(null);

    const { data, error: rpcError } = await supabase.rpc('get_order_status', {
      p_order_code: code,
    });

    if (rpcError) {
      console.error('Error fetching order status:', rpcError);
      setError('Unable to retrieve order status right now. Please try again later.');
      setLoading(false);
      return;
    }

    if (!data) {
      setError('Order not found. Please double-check your code and try again.');
      setLoading(false);
      return;
    }

    const record = Array.isArray(data) ? data[0] : data;

    if (!record) {
      setError('Order not found. Please double-check your code and try again.');
      setLoading(false);
      return;
    }

    setOrder({
      order_code: record.order_code,
      customer_name: record.customer_name,
      service_type: record.service_type,
      status: (record.status ?? 'pending') as OrderStatus,
      total: Number(record.total ?? 0),
      tip: record.tip ? Number(record.tip) : undefined,
      table_number: record.table_number ?? undefined,
      pickup_time: record.pickup_time ?? undefined,
      created_at: record.created_at,
      updated_at: record.updated_at,
      line_items: (record.line_items || []) as OrderLineItem[],
    });
    setInputCode(code);
    setLoading(false);
  }, []);

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault();

    const code = inputCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter your order code.');
      setOrder(null);
      return;
    }

    await fetchOrderStatus(code);
  };

  React.useEffect(() => {
    if (initialCode) {
      const code = initialCode.trim().toUpperCase();
      setInputCode(code);
      fetchOrderStatus(code);
    }
  }, [fetchOrderStatus, initialCode]);

  return (
    <div className="min-h-screen bg-alchemy-night text-alchemy-cream py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-alchemy-cream/70 hover:text-alchemy-gold transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Menu</span>
          </button>
        </div>

        <div className="alchemy-panel rounded-2xl border border-white/10 p-8 shadow-lg shadow-black/30">
          <h1 className="text-3xl font-playfair font-semibold text-alchemy-gold mb-2">Track Your Order</h1>
          <p className="text-alchemy-cream/70 mb-6">
            Enter the order code you received after checkout to view the latest status.
          </p>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 border border-white/15 bg-white/5 text-alchemy-cream rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 placeholder:text-alchemy-cream/40 uppercase"
              placeholder="e.g., RY-240904-00015"
              aria-label="Order code"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night font-medium hover:from-alchemy-copper hover:to-alchemy-gold transition-all duration-200"
            >
              <Search className="h-5 w-5" />
              <span>Check Status</span>
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-10 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-alchemy-gold" />
            </div>
          )}

          {order && !loading && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-widest text-alchemy-cream/50">Order Code</p>
                  <p className="text-2xl font-semibold text-alchemy-gold font-mono">{order.order_code}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-alchemy-cream/70">
                <div>
                  <p className="font-medium text-alchemy-cream">Customer</p>
                  <p>{order.customer_name}</p>
                </div>
                <div>
                  <p className="font-medium text-alchemy-cream">Service Type</p>
                  <p className="capitalize">{order.service_type.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="font-medium text-alchemy-cream">Order Total</p>
                  <p className="text-lg text-alchemy-gold font-semibold">₱{order.total.toFixed(2)}</p>
                  {order.tip && order.tip > 0 && (
                    <p className="text-xs text-alchemy-cream/60 mt-1">
                      (Includes ₱{order.tip.toFixed(2)} tip)
                    </p>
                  )}
                </div>
                {order.service_type === 'dine-in' && order.table_number && (
                  <div>
                    <p className="font-medium text-alchemy-cream">Table</p>
                    <p>{order.table_number}</p>
                  </div>
                )}
                {order.service_type === 'pickup' && order.pickup_time && (
                  <div>
                    <p className="font-medium text-alchemy-cream">Pick-up Time</p>
                    <p>{order.pickup_time}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-alchemy-cream">Placed</p>
                  <p>{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-alchemy-cream">Last Updated</p>
                  <p>{new Date(order.updated_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg">
                <div className="px-4 py-3 border-b border-white/10 text-sm uppercase tracking-wider text-alchemy-cream/60">
                  Order Items
                </div>
                <div className="divide-y divide-white/10">
                  {order.line_items.map(item => (
                    <div key={item.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-medium text-alchemy-cream">{item.name}</p>
                        {item.selectedVariation && (
                          <p className="text-xs text-alchemy-cream/60">Variation: {item.selectedVariation.name}</p>
                        )}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <p className="text-xs text-alchemy-cream/60">
                            Add-ons: {item.selectedAddOns.map(addOn =>
                              addOn.quantity && addOn.quantity > 1
                                ? `${addOn.name} x${addOn.quantity}`
                                : addOn.name
                            ).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-alchemy-cream/70">
                        <span>Qty: {item.quantity}</span>
                        <span className="font-semibold text-alchemy-gold">₱{(item.totalPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracker;
