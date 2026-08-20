import { supabase } from '../lib/supabase';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '.functions.supabase.co') || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const orderService = {
  /**
   * Creates a new direct order via the secure create-order Edge Function.
   * The Edge Function validates product, calculates total server-side, and
   * sends the customer confirmation email.
   * NEVER pass price/total from frontend — Edge Function calculates it.
   */
  async createOrder(orderPayload) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create order.');
    }

    return data;
  },

  /**
   * Confirms an order via the secure confirm-order Edge Function.
   * The token is validated server-side atomically.
   */
  async confirmOrder(token) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to confirm order.');
    }

    return data;
  },

  /**
   * Admin-only: fetch all orders with pagination.
   * Requires admin auth — RLS enforces this on the server.
   */
  async getAdminOrders({ page = 1, limit = 20, status = '', search = '' } = {}) {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    return { data, count, page, limit, totalPages: Math.ceil((count || 0) / limit) };
  },

  /**
   * Admin-only: update order status.
   * RLS ensures only authenticated admins can do this.
   */
  async updateOrderStatus(orderId, newStatus) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
