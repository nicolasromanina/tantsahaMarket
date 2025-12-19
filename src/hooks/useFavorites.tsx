import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    unit: string;
    images: string[] | null;
    producer?: {
      id: string;
      farm_name: string | null;
    };
    category?: {
      id: string;
      name: string;
      name_mg: string;
    };
  };
}

export const useFavorites = (userId: string) => {
  return useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          *,
          product:products(
            id,
            name,
            price,
            unit,
            images,
            producer:producers(id, farm_name),
            category:categories(id, name, name_mg)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Favorite[];
    },
    enabled: !!userId,
  });
};

export const useIsFavorite = (userId: string, productId: string) => {
  return useQuery({
    queryKey: ["is-favorite", userId, productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!productId,
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      productId,
      isFavorite,
    }: {
      userId: string;
      productId: string;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, product_id: productId });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["is-favorite", variables.userId, variables.productId] });
      toast({
        title: variables.isFavorite ? "Nesorina" : "Notehirizina",
        description: variables.isFavorite
          ? "Nesorina tamin'ny tiako"
          : "Nampidirina amin'ny tiako",
      });
    },
    onError: () => {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka nanao io asa io",
        variant: "destructive",
      });
    },
  });
};
