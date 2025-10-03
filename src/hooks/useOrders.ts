import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, OrderLineItem } from '../types';

type OrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  contact_number: string;
  service_type: string;
  table_number: string | null;
  notes: string | null;
  payment_method: string;
  total: number;
  status: string;
  line_items: OrderLineItem[] | null;
  messenger_payload: string | null;
  created_at: string;
  updated_at: string;
};

const mapRowToOrder = (row: OrderRow): Order => ({
  id: row.id,
  orderCode: row.order_code,
  customerName: row.customer_name,
  contactNumber: row.contact_number,
  serviceType: row.service_type as Order['serviceType'],
  tableNumber: row.table_number ?? undefined,
  paymentMethod: row.payment_method as Order['paymentMethod'],
  total: Number(row.total),
  status: row.status as OrderStatus,
  items: (row.line_items ?? []) as OrderLineItem[],
  notes: row.notes ?? undefined,
  messengerPayload: row.messenger_payload ?? undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formatted = (data as OrderRow[] | null)?.map(mapRowToOrder) ?? [];
      setOrders(formatted);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        setUpdatingId(orderId);
        const { error: updateError, data } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId)
          .select('*')
          .single();

        if (updateError) throw updateError;

        if (data) {
          setOrders(prev =>
            prev.map(order => (order.id === orderId ? mapRowToOrder(data as OrderRow) : order))
          );
        }
      } catch (err) {
        console.error('Error updating order:', err);
        throw err;
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );

  const removeOrder = useCallback(async (orderId: string) => {
    try {
      setUpdatingId(orderId);
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (deleteError) throw deleteError;

      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Error deleting order:', err);
      throw err;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    updatingId,
    updateOrderStatus,
    removeOrder,
    refetch: fetchOrders,
  };
};
