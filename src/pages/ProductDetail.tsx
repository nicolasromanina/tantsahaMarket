import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useProduct, useProductReviews, useCreateReview } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import {
  Star,
  Heart,
  ShoppingCart,
  MapPin,
  Phone,
  Leaf,
  Award,
  Minus,
  Plus,
  ChevronLeft,
  Package,
  Calendar,
  User,
  CheckCircle,
  Truck,
} from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  const { data: product, isLoading } = useProduct(id || "");
  const { data: reviews = [] } = useProductReviews(id || "");
  const { data: isFavorite = false } = useIsFavorite(user?.id || "", id || "");
  const toggleFavorite = useToggleFavorite();
  const createReview = useCreateReview();

  const handleAddToCart = () => {
    if (product) {
      addItem(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "📦",
          unit: product.unit,
          producer_id: product.producer_id,
        },
        quantity
      );
    }
  };

  const handleToggleFavorite = () => {
    if (user && id) {
      toggleFavorite.mutate({ userId: user.id, productId: id, isFavorite });
    } else {
      navigate("/auth");
    }
  };

  const handleSubmitReview = () => {
    if (user && id && newComment.trim()) {
      createReview.mutate(
        { productId: id, rating: newRating, comment: newComment, userId: user.id },
        { onSuccess: () => setNewComment("") }
      );
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Vokatra tsy hita</h1>
            <p className="text-muted-foreground mb-6">Miala tsiny, tsy hita io vokatra io.</p>
            <Button onClick={() => navigate("/marketplace")}>Hiverina any amin'ny tsena</Button>
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
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Hiverina
          </button>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center overflow-hidden">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-9xl">📦</span>
                )}

                {product.is_organic && (
                  <span className="absolute top-4 left-4 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full flex items-center gap-1">
                    <Leaf className="w-4 h-4" />
                    Organika
                  </span>
                )}

                <button
                  onClick={handleToggleFavorite}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isFavorite
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-card shadow-md hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {product.category?.name_mg || product.category?.name}
                </span>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-1">
                  {product.name}
                </h1>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-secondary text-secondary" />
                    <span className="font-semibold">{avgRating}</span>
                    <span className="text-muted-foreground">({reviews.length} avis)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-primary">
                  Ar {product.price.toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground">/{product.unit}</span>
              </div>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              )}

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock</p>
                    <p className="font-semibold">
                      {product.stock_quantity ?? 0} {product.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Min. commande</p>
                    <p className="font-semibold">
                      {product.min_order_quantity ?? 1} {product.unit}
                    </p>
                  </div>
                </div>

                {product.harvest_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Récolte</p>
                      <p className="font-semibold">
                        {new Date(product.harvest_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Quantité:</span>
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-muted transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-muted transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Hividiana
                </Button>
              </div>

              {/* Producer Info */}
              {product.producer && (
                <Link
                  to={`/producer/${product.producer.id}`}
                  className="block p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      {(product.producer as any).profile?.avatar_url ? (
                        <img
                          src={(product.producer as any).profile.avatar_url}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {product.producer.farm_name ||
                            (product.producer as any).profile?.full_name ||
                            "Mpamboly"}
                        </h3>
                        {(product.producer as any).profile?.is_verified && (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {(product.producer as any).profile?.region && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {(product.producer as any).profile.region}
                          </span>
                        )}
                        {product.producer.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-secondary text-secondary" />
                            {product.producer.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold mb-6">
              Fanamarihana ({reviews.length})
            </h2>

            {/* Add Review */}
            {user && (
              <div className="bg-card rounded-xl p-6 mb-8 shadow-card">
                <h3 className="font-semibold mb-4">Ampidiro ny hevitrao</h3>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setNewRating(star)}>
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating
                            ? "fill-secondary text-secondary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Soraty eto ny hevitrao..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-4"
                />
                <Button
                  onClick={handleSubmitReview}
                  disabled={!newComment.trim() || createReview.isPending}
                >
                  {createReview.isPending ? "Ampidirina..." : "Alefa"}
                </Button>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Tsy mbola misy fanamarihana
                </p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">
                              {(review as any).profile?.full_name || "Mpanjifa"}
                            </p>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "fill-secondary text-secondary"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
