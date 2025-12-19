import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProducerProfile {
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
  profile?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    bio: string | null;
    region: string | null;
    address: string | null;
    is_verified: boolean | null;
  };
}

export const useProducerByUserId = (userId: string) => {
  return useQuery({
    queryKey: ["producer-by-user", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      // Fetch profile separately
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
        
      return { ...data, profile } as ProducerProfile;
    },
    enabled: !!userId,
  });
};

export const useProducer = (producerId: string) => {
  return useQuery({
    queryKey: ["producer", producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producers")
        .select("*")
        .eq("id", producerId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      // Fetch profile separately
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user_id)
        .maybeSingle();
        
      return { ...data, profile } as ProducerProfile;
    },
    enabled: !!producerId,
  });
};

export const useCreateProducer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      farmName,
      farmSize,
      mainProducts,
      certifications,
    }: {
      userId: string;
      farmName?: string;
      farmSize?: number;
      mainProducts?: string[];
      certifications?: string[];
    }) => {
      // First add producer role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "producer" });

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      // Create producer profile
      const { data, error } = await supabase
        .from("producers")
        .insert({
          user_id: userId,
          farm_name: farmName,
          farm_size_hectares: farmSize,
          main_products: mainProducts,
          certifications: certifications,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["producer-by-user", variables.userId] });
      toast({
        title: "Mpamboly vaovao",
        description: "Lasa mpamboly ianao ankehitriny",
      });
    },
    onError: () => {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka nampiditra anao ho mpamboly",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProducer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ProducerProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("producers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-by-user"] });
      queryClient.invalidateQueries({ queryKey: ["producer"] });
      toast({
        title: "Voaova",
        description: "Vita ny fanavaozana ny mombamomba anao",
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

export const useAllProducers = () => {
  return useQuery({
    queryKey: ["all-producers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producers")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for all producers
      const producersWithProfiles = await Promise.all(
        (data || []).map(async (producer) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", producer.user_id)
            .maybeSingle();
          return { ...producer, profile } as ProducerProfile;
        })
      );
      
      return producersWithProfiles;
    },
  });
};
