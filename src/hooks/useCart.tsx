import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  producerId: string;
  producerName: string;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (product: any, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load cart from database when user is logged in
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      // Load from localStorage for non-authenticated users
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    }
  }, [user]);

  // Save to localStorage when not authenticated
  useEffect(() => {
    if (!user && items.length > 0) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, user]);

  const loadCart = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            unit,
            images,
            producer_id,
            producers (
              id,
              farm_name,
              user_id,
              profiles:user_id (full_name)
            )
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const cartItems: CartItem[] = (data || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        name: item.products.name,
        price: Number(item.products.price),
        quantity: Number(item.quantity),
        unit: item.products.unit,
        producerId: item.products.producer_id,
        producerName: item.products.producers?.farm_name || item.products.producers?.profiles?.full_name || "Mpamboly",
        image: item.products.images?.[0] || "🥬",
      }));

      setItems(cartItems);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  const addItem = async (product: any, quantity: number) => {
    const newItem: CartItem = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      unit: product.unit,
      producerId: product.producer_id,
      producerName: product.producer?.farm_name || "Mpamboly",
      image: product.images?.[0] || product.image || "🥬",
    };

    // Check if item already exists
    const existingIndex = items.findIndex((i) => i.productId === product.id);

    if (existingIndex >= 0) {
      // Update quantity
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += quantity;
      setItems(updatedItems);

      if (user) {
        await supabase
          .from("cart_items")
          .update({ quantity: updatedItems[existingIndex].quantity })
          .eq("user_id", user.id)
          .eq("product_id", product.id);
      }
    } else {
      // Add new item
      setItems([...items, newItem]);

      if (user) {
        const { data } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
          })
          .select()
          .single();

        if (data) {
          setItems((prev) =>
            prev.map((i) => (i.id === newItem.id ? { ...i, id: data.id } : i))
          );
        }
      }
    }

    toast({
      title: "Nampidirina tao amin'ny harona",
      description: `${product.name} x${quantity}`,
    });
  };

  const removeItem = async (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));

    if (user) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
    }

    toast({
      title: "Nesorina tamin'ny harona",
    });
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(productId);
    }

    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );

    if (user) {
      await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", user.id)
        .eq("product_id", productId);
    }
  };

  const clearCart = async () => {
    setItems([]);
    localStorage.removeItem("cart");

    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
