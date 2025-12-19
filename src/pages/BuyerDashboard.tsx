import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useBuyerOrders } from "@/hooks/useOrders";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag,
  Heart,
  User,
  Settings,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  Phone,
  Loader2,
  Package,
  Trash2,
  Edit,
  Save,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Miandry", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { label: "Mandeha", color: "bg-orange-100 text-orange-800", icon: Clock },
  confirmed: { label: "Nekena", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  shipped: { label: "Nalefa", color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "Tonga", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Najanona", color: "bg-red-100 text-red-800", icon: XCircle },
};

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { data: orders = [], isLoading: ordersLoading } = useBuyerOrders(user?.id || "");
  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites(user?.id || "");
  const toggleFavorite = useToggleFavorite();

  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    region: "",
    address: "",
    bio: "",
  });

  // Load profile
  useState(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            setProfileForm({
              full_name: data.full_name || "",
              phone: data.phone || "",
              region: data.region || "",
              address: data.address || "",
              bio: data.bio || "",
            });
          }
        });
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSaveProfile = async () => {
    const { error } = await supabase.from("profiles").update(profileForm).eq("id", user.id);

    if (error) {
      toast({
        title: "Nisy olana",
        description: "Tsy afaka nanova ny mombamomba anao",
        variant: "destructive",
      });
    } else {
      setProfile({ ...profile, ...profileForm });
      setIsEditing(false);
      toast({
        title: "Vita",
        description: "Voatahiry ny fanavaozana",
      });
    }
  };

  const handleRemoveFavorite = (productId: string) => {
    toggleFavorite.mutate({ userId: user.id, productId, isFavorite: true });
  };

  const totalSpent = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Tongasoa, {profile?.full_name || user.email}
              </p>
            </div>
            <Link to="/producer-dashboard">
              <Button variant="outline" className="gap-2">
                <Package className="w-4 h-4" />
                Lasa Mpamboly
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fandaharana</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tiako</p>
                    <p className="text-2xl font-bold">{favorites.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vita</p>
                    <p className="text-2xl font-bold">
                      {orders.filter((o) => o.status === "delivered").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vola lany</p>
                    <p className="text-2xl font-bold">Ar {totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders">
            <TabsList className="mb-6">
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                Fandaharana
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="w-4 h-4" />
                Tiako
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <div className="space-y-4">
                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Tsy mbola misy fandaharana</p>
                      <Link to="/marketplace">
                        <Button>Jereo ny tsena</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  orders.map((order) => {
                    const StatusIcon = statusConfig[order.status].icon;
                    return (
                      <Card key={order.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-mono font-semibold">{order.order_number}</span>
                                <Badge className={statusConfig[order.status].color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig[order.status].label}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p className="flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  {order.producer?.farm_name || "Mpamboly"}
                                </p>
                                {order.delivery_region && (
                                  <p className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {order.delivery_region}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                Ar {order.total_amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="space-y-1">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between text-sm text-muted-foreground"
                                  >
                                    <span>
                                      {item.product_name} x{Number(item.quantity)}
                                    </span>
                                    <span>Ar {Number(item.total_price).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="favorites">
              {favoritesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : favorites.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Tsy mbola misy tiako</p>
                    <Link to="/marketplace">
                      <Button>Jereo ny tsena</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav) => (
                    <Card key={fav.id} className="overflow-hidden">
                      <Link to={`/product/${fav.product_id}`}>
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {fav.product?.images?.[0] ? (
                            <img
                              src={fav.product.images[0]}
                              alt={fav.product?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{fav.product?.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {fav.product?.producer?.farm_name}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary">
                            Ar {fav.product?.price?.toLocaleString()}/{fav.product?.unit}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFavorite(fav.product_id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Mombamomba anao</CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Ovao
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleSaveProfile}>
                      <Save className="w-4 h-4 mr-2" />
                      Tehirizo
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Anarana feno</label>
                      {isEditing ? (
                        <Input
                          value={profileForm.full_name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, full_name: e.target.value })
                          }
                        />
                      ) : (
                        <p className="py-2">{profile?.full_name || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefaonina</label>
                      {isEditing ? (
                        <Input
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                        />
                      ) : (
                        <p className="py-2">{profile?.phone || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Faritra</label>
                      {isEditing ? (
                        <Input
                          value={profileForm.region}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, region: e.target.value })
                          }
                        />
                      ) : (
                        <p className="py-2">{profile?.region || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Adiresy</label>
                      {isEditing ? (
                        <Input
                          value={profileForm.address}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, address: e.target.value })
                          }
                        />
                      ) : (
                        <p className="py-2">{profile?.address || "-"}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bio</label>
                    {isEditing ? (
                      <Textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <p className="py-2">{profile?.bio || "-"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default BuyerDashboard;
