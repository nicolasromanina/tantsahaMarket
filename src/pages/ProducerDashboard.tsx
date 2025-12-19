import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useProducerByUserId, useCreateProducer, useUpdateProducer } from "@/hooks/useProducer";
import { useProducerProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useCategories } from "@/hooks/useProducts";
import { useProducerOrders, useOrderStats, useUpdateOrderStatus } from "@/hooks/useOrders";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  Phone,
  Loader2,
  BarChart3,
  Settings,
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

const ProducerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: producer, isLoading: producerLoading } = useProducerByUserId(user?.id || "");
  const { data: products = [] } = useProducerProducts(producer?.id || "");
  const { data: orders = [] } = useProducerOrders(producer?.id || "");
  const { data: stats } = useOrderStats(producer?.id || "");
  const { data: categories = [] } = useCategories();
  const createProducer = useCreateProducer();
  const updateProducer = useUpdateProducer();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    unit: "kg",
    stock_quantity: "",
    category_id: "",
    is_organic: false,
  });

  const [becomeProducerForm, setBecomeProducerForm] = useState({
    farmName: "",
    farmSize: "",
  });

  if (authLoading || producerLoading) {
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

  const handleBecomeProducer = () => {
    createProducer.mutate({
      userId: user.id,
      farmName: becomeProducerForm.farmName || undefined,
      farmSize: becomeProducerForm.farmSize ? parseFloat(becomeProducerForm.farmSize) : undefined,
    });
  };

  if (!producer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Lasa Mpamboly</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Ampidiro ny mombamomba ny toeram-pambolena mba hanakaramana ny vokatrao
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Anaran'ny toeram-pambolena</label>
                  <Input
                    value={becomeProducerForm.farmName}
                    onChange={(e) =>
                      setBecomeProducerForm({ ...becomeProducerForm, farmName: e.target.value })
                    }
                    placeholder="Ohatra: Tanimboly Rakoto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Habe (hectare)</label>
                  <Input
                    type="number"
                    value={becomeProducerForm.farmSize}
                    onChange={(e) =>
                      setBecomeProducerForm({ ...becomeProducerForm, farmSize: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleBecomeProducer}
                  disabled={createProducer.isPending}
                >
                  {createProducer.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Hiditra ho mpamboly
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const handleOpenProductDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        unit: product.unit,
        stock_quantity: product.stock_quantity?.toString() || "",
        category_id: product.category_id || "",
        is_organic: product.is_organic || false,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        unit: "kg",
        stock_quantity: "",
        category_id: "",
        is_organic: false,
      });
    }
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      updateProduct.mutate(
        {
          id: editingProduct.id,
          name: productForm.name,
          description: productForm.description || null,
          price: parseFloat(productForm.price),
          unit: productForm.unit,
          stock_quantity: productForm.stock_quantity ? parseFloat(productForm.stock_quantity) : null,
          category_id: productForm.category_id || null,
          is_organic: productForm.is_organic,
        },
        { onSuccess: () => setIsProductDialogOpen(false) }
      );
    } else {
      createProduct.mutate(
        {
          name: productForm.name,
          description: productForm.description || undefined,
          price: parseFloat(productForm.price),
          unit: productForm.unit,
          stock_quantity: productForm.stock_quantity ? parseFloat(productForm.stock_quantity) : undefined,
          category_id: productForm.category_id || undefined,
          producer_id: producer.id,
          is_organic: productForm.is_organic,
        },
        { onSuccess: () => setIsProductDialogOpen(false) }
      );
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Tena hofafanao ve ity vokatra ity?")) {
      deleteProduct.mutate(productId);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    updateOrderStatus.mutate({ orderId, status });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Dashboard Mpamboly</h1>
              <p className="text-muted-foreground">
                {producer.farm_name || producer.profile?.full_name || "Mpamboly"}
              </p>
            </div>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => handleOpenProductDialog()}>
                  <Plus className="w-4 h-4" />
                  Vokatra vaovao
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Ovao ny vokatra" : "Vokatra vaovao"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Anarana *</label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Anaran'ny vokatra"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Famaritana</label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Famaritana ny vokatra"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Vidiny (Ar) *</label>
                      <Input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vatra</label>
                      <Select
                        value={productForm.unit}
                        onValueChange={(v) => setProductForm({ ...productForm, unit: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="litatra">litatra</SelectItem>
                          <SelectItem value="pièce">pièce</SelectItem>
                          <SelectItem value="paquet">paquet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Stock</label>
                      <Input
                        type="number"
                        value={productForm.stock_quantity}
                        onChange={(e) =>
                          setProductForm({ ...productForm, stock_quantity: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Karazana</label>
                      <Select
                        value={productForm.category_id}
                        onValueChange={(v) => setProductForm({ ...productForm, category_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Safidio" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name_mg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_organic"
                      checked={productForm.is_organic}
                      onCheckedChange={(checked) =>
                        setProductForm({ ...productForm, is_organic: !!checked })
                      }
                    />
                    <label htmlFor="is_organic" className="text-sm">
                      Vokatra organika
                    </label>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSaveProduct}
                    disabled={!productForm.name || !productForm.price || createProduct.isPending || updateProduct.isPending}
                  >
                    {createProduct.isPending || updateProduct.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {editingProduct ? "Tehirizo" : "Ampio"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vokatra</p>
                    <p className="text-2xl font-bold">{products.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fandaharana</p>
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Miandry</p>
                    <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vola miditra</p>
                    <p className="text-2xl font-bold">
                      Ar {(stats?.totalRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="products">
            <TabsList className="mb-6">
              <TabsTrigger value="products" className="gap-2">
                <Package className="w-4 h-4" />
                Vokatra
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                Fandaharana
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Paramètre
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-12 text-center">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Tsy mbola misy vokatra</p>
                      <Button className="mt-4" onClick={() => handleOpenProductDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ampio vokatra
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  products.map((product: any) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {product.category?.name_mg}
                            </p>
                          </div>
                          {product.is_organic && (
                            <Badge variant="secondary" className="text-xs">
                              Organika
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold text-primary">
                            Ar {product.price.toLocaleString()}/{product.unit}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Stock: {product.stock_quantity || 0}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleOpenProductDialog(product)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Ovao
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Tsy mbola misy fandaharana</p>
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
                                  <Users className="w-4 h-4" />
                                  {order.buyer?.full_name || "Mpanjifa"}
                                </p>
                                {order.buyer?.phone && (
                                  <p className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {order.buyer.phone}
                                  </p>
                                )}
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
                              <div className="mt-3">
                                <Select
                                  value={order.status}
                                  onValueChange={(v) =>
                                    handleUpdateOrderStatus(order.id, v as OrderStatus)
                                  }
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Miandry</SelectItem>
                                    <SelectItem value="confirmed">Nekena</SelectItem>
                                    <SelectItem value="shipped">Nalefa</SelectItem>
                                    <SelectItem value="delivered">Tonga</SelectItem>
                                    <SelectItem value="cancelled">Najanona</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-sm font-medium mb-2">Vokatra:</p>
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

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Mombamomba ny toeram-pambolena</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Anaran'ny tanimboly</label>
                    <Input
                      defaultValue={producer.farm_name || ""}
                      placeholder="Anaran'ny toeram-pambolena"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Habe (hectare)</label>
                    <Input
                      type="number"
                      defaultValue={producer.farm_size_hectares || ""}
                      placeholder="0"
                    />
                  </div>
                  <Button>Tehirizo</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ProducerDashboard;
