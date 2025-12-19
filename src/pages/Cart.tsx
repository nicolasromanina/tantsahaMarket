import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import MobileMoneyPayment from "@/components/payment/MobileMoneyPayment";
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  ArrowRight, 
  MapPin,
  CreditCard 
} from "lucide-react";

const Cart = () => {
  const { items, total, updateQuantity, removeItem, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const deliveryFee = total > 50000 ? 0 : 5000;
  const grandTotal = total + deliveryFee;

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // For demo purposes, we'll simulate order creation
    // In production, you would create the order in the database first
    setCurrentOrderId(`demo-order-${Date.now()}`);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    clearCart();
    setShowPayment(false);
    // Navigate to order confirmation
    navigate("/marketplace");
  };

  if (items.length === 0 && !showPayment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-3">
                Tsy misy ao amin'ny harona
              </h1>
              <p className="text-muted-foreground mb-8">
                Tadiavo ny vokatra tianao ary ampio ao amin'ny harona
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/marketplace">
                  Hitsidika ny tsena
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
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
          <h1 className="font-display text-3xl font-bold text-foreground mb-8">
            Ny harona ({itemCount})
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {!showPayment && items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-card rounded-2xl p-4 shadow-card flex gap-4 animate-scale-in"
                >
                  {/* Image */}
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-4xl">{item.image}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.producerName}
                    </p>
                    <p className="font-display font-bold text-primary">
                      Ar {item.price.toLocaleString()}/{item.unit}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="font-semibold text-foreground">
                      Ar {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {/* Payment Form */}
              {showPayment && currentOrderId && (
                <div className="bg-card rounded-2xl p-6 shadow-card">
                  <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Fandoavana
                  </h2>
                  <MobileMoneyPayment
                    orderId={currentOrderId}
                    amount={grandTotal}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPayment(false)}
                  />
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-card sticky top-24">
                <h2 className="font-display text-xl font-bold text-foreground mb-6">
                  Famintinana
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Totalin'ny vokatra</span>
                    <span>Ar {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Fanaterana
                    </span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-primary">Maimaim-poana</span>
                      ) : (
                        `Ar ${deliveryFee.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-xs text-muted-foreground">
                      * Maimaim-poana ny fanaterana raha mihoatra ny Ar 50,000
                    </p>
                  )}
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between font-display font-bold text-lg">
                      <span>Totaliny</span>
                      <span className="text-primary">Ar {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!showPayment && (
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                  >
                    {user ? "Handoa" : "Hiditra ary handoa"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                <Link
                  to="/marketplace"
                  className="block text-center mt-4 text-primary font-medium hover:underline"
                >
                  Hanohy ny fividianana
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
