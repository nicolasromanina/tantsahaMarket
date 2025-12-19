import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  stock_quantity: number | null;
  min_order_quantity: number | null;
  is_organic: boolean | null;
  is_available: boolean | null;
  images: string[] | null;
  harvest_date: string | null;
  created_at: string;
  updated_at: string;
  producer_id: string;
  category_id: string | null;
  producer?: Producer;
  category?: Category;
}

export interface Producer {
  id: string;
  user_id: string;
  farm_name: string | null;
  farm_size_hectares: number | null;
  main_products: string[] | null;
  certifications: string[] | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_reviews: number | null;
  total_sales: number | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  address: string | null;
  is_verified: boolean | null;
}

export interface Category {
  id: string;
  name: string;
  name_mg: string;
  description: string | null;
  icon: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const useProducts = (categoryId?: string, search?: string) => {
  return useQuery({
    queryKey: ["products", categoryId, search],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          producer:producers(*),
          category:categories(*)
        `)
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Product[];
    },
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          producer:producers(*),
          category:categories(*)
        `)
        .eq("id", productId)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.producer) {
        // Fetch producer's profile separately
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", (data.producer as any).user_id)
          .maybeSingle();
        
        (data as any).producer.profile = profile;
      }
      
      return data as unknown as Product | null;
    },
    enabled: !!productId,
  });
};

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for each review
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", review.user_id)
            .maybeSingle();
          return { ...review, profile } as Review & { profile?: Profile };
        })
      );
      
      return reviewsWithProfiles;
    },
    enabled: !!productId,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      productId,
      rating,
      comment,
      userId,
    }: {
      productId: string;
      rating: number;
      comment: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          product_id: productId,
          rating,
          comment,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
      toast({
        title: "Fanamarihana vita",
        description: "Misaotra anao noho ny fanehoanao hevitra",
      });
    },
    onError: () => {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka nampiditra ny fanamarihana",
        variant: "destructive",
      });
    },
  });
};

export const useProducerProducts = (producerId: string) => {
  return useQuery({
    queryKey: ["producer-products", producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("producer_id", producerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!producerId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: {
      name: string;
      description?: string;
      price: number;
      unit: string;
      stock_quantity?: number;
      category_id?: string;
      producer_id: string;
      is_organic?: boolean;
      images?: string[];
    }) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["producer-products", variables.producer_id] });
      toast({
        title: "Vokatra vaovao",
        description: "Vita ny fanamboarana ny vokatra",
      });
    },
    onError: () => {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka namorona ny vokatra",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Vokatra voaova",
        description: "Vita ny fanavaozana ny vokatra",
      });
    },
    onError: () => {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka nanao fanavaozana",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Vokatra voafafa",
        description: "Voafafa tanteraka ny vokatra",
      });
    },
    onError: () => {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka namafa ny vokatra",
        variant: "destructive",
      });
    },
  });
};
