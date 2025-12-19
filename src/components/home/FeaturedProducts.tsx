import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, MapPin, Heart, ShoppingCart } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Vary gasy voalohany",
    category: "Vary",
    price: 2500,
    unit: "kg",
    location: "Alaotra",
    rating: 4.8,
    reviews: 124,
    image: "🍚",
    isNew: true,
    producer: "Rakoto Jean"
  },
  {
    id: 2,
    name: "Voatabia organika",
    category: "Legioma",
    price: 3200,
    unit: "kg",
    location: "Vakinankaratra",
    rating: 4.9,
    reviews: 89,
    image: "🍅",
    isNew: false,
    producer: "Rasoa Marie"
  },
  {
    id: 3,
    name: "Mangahazo vaovao",
    category: "Legioma",
    price: 1800,
    unit: "kg",
    location: "Atsimo Andrefana",
    rating: 4.7,
    reviews: 156,
    image: "🥔",
    isNew: true,
    producer: "Rabe Pierre"
  },
  {
    id: 4,
    name: "Mofomamy tantely",
    category: "Tantely",
    price: 45000,
    unit: "litatra",
    location: "Haute Matsiatra",
    rating: 5.0,
    reviews: 67,
    image: "🍯",
    isNew: false,
    producer: "Koto Haingo"
  },
  {
    id: 5,
    name: "Voasary mamy",
    category: "Voankazo",
    price: 4500,
    unit: "kg",
    location: "Diana",
    rating: 4.6,
    reviews: 203,
    image: "🍊",
    isNew: true,
    producer: "Noro Hanta"
  },
  {
    id: 6,
    name: "Ronono vaovao",
    category: "Ronono",
    price: 3800,
    unit: "litatra",
    location: "Vakinankaratra",
    rating: 4.9,
    reviews: 178,
    image: "🥛",
    isNew: false,
    producer: "Faly Andrianaivo"
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Vokatra malaza
            </h2>
            <p className="text-muted-foreground mt-2">Ny tsara indrindra avy amin'ny mpamboly</p>
          </div>
          <Link 
            to="/marketplace" 
            className="group flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            Hijery rehetra
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                  {product.image}
                </span>
                
                {/* Badges */}
                {product.isNew && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                    Vaovao
                  </span>
                )}
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-9 h-9 rounded-full bg-card shadow-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Category & Rating */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="text-sm font-medium text-foreground">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>

                {/* Producer & Location */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span>{product.producer}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {product.location}
                  </span>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <span className="font-display font-bold text-xl text-primary">
                      Ar {product.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/{product.unit}</span>
                  </div>
                  <Button variant="hero" size="sm" className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Hividiana
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-10">
          <Button variant="outline" size="lg" className="gap-2">
            Hijery bebe kokoa
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
