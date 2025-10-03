import React, { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Trash2, ClipboardList } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { OrderStatus } from '../types';

interface OrderManagerProps {
  onBack: () => void;
}

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
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

const OrderManager: React.FC<OrderManagerProps> = ({ onBack }) => {
  const { orders, loading, error, updatingId, updateOrderStatus, removeOrder, refetch } = useOrders();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());

  const playNotification = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.warn('Notification audio element missing');
      return;
    }

    // reset to start for rapid successive plays
    audio.currentTime = 0;
    audio
      .play()
      .catch((err) => {
        console.error('Notification audio error:', err);
      });
  }, []);

  React.useEffect(() => {
    if (!audioRef.current) {
      const element = new Audio('/notif-sound.mp3');
      element.preload = 'auto';
      element.volume = 1;
      audioRef.current = element;
    }

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    return ORDER_STATUS_OPTIONS.reduce(
      (acc, status) => ({
        ...acc,
        [status]: orders.filter(order => order.status === status).length,
      }),
      { total: orders.length } as Record<OrderStatus | 'total', number>
    );
  }, [orders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setActionError(null);
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Remove this order from the dashboard?')) return;
    setActionError(null);
    try {
      await removeOrder(orderId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  React.useEffect(() => {
    const previousIds = knownOrderIdsRef.current;
    const currentIds = new Set(orders.map(order => order.id));

    const hasLoadedBefore = previousIds.size > 0;
    const hasNewOrder = orders.some(order => !previousIds.has(order.id));

    if (hasLoadedBefore && hasNewOrder) {
      playNotification();
    }

    knownOrderIdsRef.current = currentIds;
  }, [orders, playNotification]);

  return (
    <div className="min-h-screen bg-alchemy-night text-alchemy-cream">
      <div className="bg-alchemy-night/80 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 bg-white/10 text-alchemy-cream px-4 py-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-white/10 hover:border-alchemy-gold/60 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm uppercase tracking-widest text-alchemy-cream/50">Order Management</div>
            <h1 className="text-3xl font-playfair font-semibold text-alchemy-gold flex items-center space-x-2">
              <ClipboardList className="h-7 w-7" />
              <span>Incoming Orders</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm text-alchemy-cream/60">Filter by status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-alchemy-cream focus:outline-none focus:ring-2 focus:ring-alchemy-gold"
            >
              <option value="all">All Orders</option>
              {ORDER_STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="alchemy-panel rounded-xl p-4 border border-white/10">
            <p className="text-xs uppercase tracking-wider text-alchemy-cream/60">Total</p>
            <p className="text-2xl font-semibold text-alchemy-gold">{stats.total}</p>
          </div>
          {ORDER_STATUS_OPTIONS.map(status => (
            <div key={status} className="alchemy-panel rounded-xl p-4 border border-white/10">
              <p className="text-xs uppercase tracking-wider text-alchemy-cream/60">{STATUS_LABELS[status]}</p>
              <p className="text-2xl font-semibold text-alchemy-gold">{stats[status]}</p>
            </div>
          ))}
        </div>

        {actionError && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
            {actionError}
          </div>
        )}

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-alchemy-gold" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="alchemy-panel rounded-2xl p-8 border border-dashed border-white/15 text-center">
            <p className="text-lg text-alchemy-cream/70">No orders {statusFilter !== 'all' ? `with status ${STATUS_LABELS[statusFilter as OrderStatus]}` : 'yet'}.</p>
            <p className="text-sm text-alchemy-cream/50 mt-2">New submissions will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => {
              const isExpanded = expandedId === order.id;
              return (
                <div key={order.id} className="alchemy-panel rounded-2xl border border-white/10 overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-5 gap-4 border-b border-white/10 bg-white/5">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-sm text-alchemy-cream/60">
                          {new Date(order.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-alchemy-gold">{order.customerName}</h3>
                      <p className="text-sm text-alchemy-cream/60">Order Code: <span className="font-mono text-alchemy-cream">{order.orderCode}</span></p>
                      <p className="text-sm text-alchemy-cream/70">
                        {order.serviceType === 'pickup' ? 'Pickup' : 'Dine-In'}
                        {order.tableNumber ? ` • Table ${order.tableNumber}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-alchemy-cream focus:outline-none focus:ring-2 focus:ring-alchemy-gold"
                      >
                        {ORDER_STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="px-4 py-2 rounded-lg border border-white/10 hover:border-alchemy-gold/60 transition-colors duration-200"
                      >
                        {isExpanded ? 'Hide items' : 'View items'}
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        disabled={updatingId === order.id}
                        className="p-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-alchemy-cream/70">
                      <div>
                        <p className="font-medium text-alchemy-cream">Contact</p>
                        <p>{order.contactNumber}</p>
                      </div>
                      <div>
                        <p className="font-medium text-alchemy-cream">Payment Method</p>
                        <p className="capitalize">{order.paymentMethod.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="font-medium text-alchemy-cream">Order Total</p>
                        <p className="text-lg text-alchemy-gold font-semibold">₱{order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-alchemy-cream/80">
                        <p className="font-medium text-alchemy-gold mb-1">Customer Notes</p>
                        <p>{order.notes}</p>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="bg-white/5 border border-white/10 rounded-lg">
                        <div className="px-4 py-3 border-b border-white/10 text-sm uppercase tracking-wider text-alchemy-cream/60">
                          Order Items
                        </div>
                        <div className="divide-y divide-white/10">
                          {order.items.map(item => (
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManager;
