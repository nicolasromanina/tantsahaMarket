import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducer } from "@/hooks/useProducer";
import { useProducerProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import {
  Star,
  MapPin,
  Phone,
  CheckCircle,
  Package,
  ShoppingCart,
  Award,
  Leaf,
  User,
  ChevronLeft,
} from "lucide-react";

const ProducerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { data: producer, isLoading } = useProducer(id || "");
  const { data: products = [] } = useProducerProducts(id || "");
  const { addItem } = useCart();

  const handleAddToCart = (product: any) => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "📦",
        unit: product.unit,
        producer_id: product.producer_id,
      },
      1
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-6 mb-8">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Mpamboly tsy hita</h1>
            <p className="text-muted-foreground mb-6">Miala tsiny, tsy hita io mpamboly io.</p>
            <Link to="/marketplace">
              <Button>Hiverina any amin'ny tsena</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Hiverina
          </Link>

          {/* Producer Header */}
          <div className="bg-gradient-hero rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden">
                {producer.profile?.avatar_url ? (
                  <img
                    src={producer.profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-primary-foreground" />
                )}
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="font-display text-3xl font-bold text-primary-foreground">
                    {producer.farm_name || producer.profile?.full_name || "Mpamboly"}
                  </h1>
                  {producer.profile?.is_verified && (
                    <CheckCircle className="w-6 h-6 text-secondary" />
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-primary-foreground/80">
                  {producer.profile?.region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {producer.profile.region}
                    </span>
                  )}
                  {producer.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-secondary text-secondary" />
                      {producer.rating} ({producer.total_reviews || 0} avis)
                    </span>
                  )}
                  {producer.total_sales && (
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      {producer.total_sales} ventes
                    </span>
                  )}
                </div>
                {producer.profile?.bio && (
                  <p className="mt-4 text-primary-foreground/70 max-w-xl">{producer.profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Vokatra</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto text-secondary mb-2" />
                <p className="text-2xl font-bold">{producer.rating || 0}</p>
                <p className="text-sm text-muted-foreground">Naoty</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto text-accent mb-2" />
                <p className="text-2xl font-bold">{producer.total_sales || 0}</p>
                <p className="text-sm text-muted-foreground">Fivarotana</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Leaf className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{producer.farm_size_hectares || 0}</p>
                <p className="text-sm text-muted-foreground">Hectare</p>
              </CardContent>
            </Card>
          </div>

          {/* Certifications */}
          {producer.certifications && producer.certifications.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-bold mb-4">Fanamarinana</h2>
              <div className="flex flex-wrap gap-2">
                {producer.certifications.map((cert, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-1"
                  >
                    <Award className="w-4 h-4" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-6">
              Vokatra ({products.length})
            </h2>
            {products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Tsy mbola misy vokatra</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <Card key={product.id} className="overflow-hidden group">
                    <Link to={`/product/${product.id}`}>
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <span className="text-6xl">📦</span>
                        )}
                        {product.is_organic && (
                          <span className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1">
                            <Leaf className="w-3 h-3" />
                            Organika
                          </span>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-semibold hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-3">
                        {product.category?.name_mg}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">
                          Ar {product.price.toLocaleString()}/{product.unit}
                        </span>
                        <Button size="sm" onClick={() => handleAddToCart(product)}>
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProducerProfile;
