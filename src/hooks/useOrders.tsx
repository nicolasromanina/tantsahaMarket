import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  producer_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number | null;
  total_amount: number;
  delivery_address: string | null;
  delivery_region: string | null;
  delivery_notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  producer?: {
    id: string;
    farm_name: string | null;
  };
  buyer?: {
    full_name: string | null;
    phone: string | null;
    region: string | null;
  };
}

export const useBuyerOrders = (buyerId: string) => {
  return useQuery({
    queryKey: ["buyer-orders", buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch producer details for each order
      const ordersWithProducers = await Promise.all(
        (data || []).map(async (order) => {
          const { data: producer } = await supabase
            .from("producers")
            .select("id, farm_name")
            .eq("id", order.producer_id)
            .maybeSingle();
          return { ...order, producer } as Order;
        })
      );
      
      return ordersWithProducers;
    },
    enabled: !!buyerId,
  });
};

export const useProducerOrders = (producerId: string) => {
  return useQuery({
    queryKey: ["producer-orders", producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("producer_id", producerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch buyer details for each order
      const ordersWithBuyers = await Promise.all(
        (data || []).map(async (order) => {
          const { data: buyer } = await supabase
            .from("profiles")
            .select("full_name, phone, region")
            .eq("id", order.buyer_id)
            .maybeSingle();
          return { ...order, buyer } as Order;
        })
      );
      
      return ordersWithBuyers;
    },
    enabled: !!producerId,
  });
};

export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      // Fetch producer details
      const { data: producer } = await supabase
        .from("producers")
        .select("id, farm_name")
        .eq("id", data.producer_id)
        .maybeSingle();
        
      // Fetch buyer details
      const { data: buyer } = await supabase
        .from("profiles")
        .select("full_name, phone, region, address")
        .eq("id", data.buyer_id)
        .maybeSingle();
        
      return { ...data, producer, buyer } as Order;
    },
    enabled: !!orderId,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      toast({
        title: "Sata vaovao",
        description: "Voaova ny satan'ny fandaharana",
      });
    },
    onError: () => {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka nanova ny sata",
        variant: "destructive",
      });
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      buyerId,
      producerId,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      deliveryAddress,
      deliveryRegion,
      deliveryNotes,
    }: {
      buyerId: string;
      producerId: string;
      items: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
      subtotal: number;
      deliveryFee: number;
      totalAmount: number;
      deliveryAddress?: string;
      deliveryRegion?: string;
      deliveryNotes?: string;
    }) => {
      // Generate order number
      const orderNumber = `TM${Date.now().toString(36).toUpperCase()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          buyer_id: buyerId,
          producer_id: producerId,
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          delivery_region: deliveryRegion,
          delivery_notes: deliveryNotes,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        ...item,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
      toast({
        title: "Fandaharana vita",
        description: "Voaray ny fandaharanao",
      });
    },
    onError: () => {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka namorona fandaharana",
        variant: "destructive",
      });
    },
  });
};

export const useOrderStats = (producerId: string) => {
  return useQuery({
    queryKey: ["order-stats", producerId],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, total_amount")
        .eq("producer_id", producerId);

      if (error) throw error;

      const stats = {
        total: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        confirmed: orders.filter((o) => o.status === "confirmed").length,
        shipped: orders.filter((o) => o.status === "shipped").length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
        totalRevenue: orders
          .filter((o) => o.status === "delivered")
          .reduce((sum, o) => sum + Number(o.total_amount), 0),
      };

      return stats;
    },
    enabled: !!producerId,
  });
};
