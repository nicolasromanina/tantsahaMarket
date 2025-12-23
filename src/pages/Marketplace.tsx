import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  MapPin, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  Heart, 
  ShoppingCart,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";

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
    image: "/produit/vary-fotsy.jpg",
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
    image: "/produit/voatabia.jpg", 
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
    image: "/produit/mangahazo.jpg", 
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
    image: "/produit/tantely.jpg", 
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
    image: "/produit/voasary.jpg", 
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
    image: "/produit/ronono.jpg", 
    isNew: false, 
    producer: "Faly Andrianaivo" 
  },
  { 
    id: 7, 
    name: "Katsaka maina", 
    category: "Vary", 
    price: 2200, 
    unit: "kg", 
    location: "Bongolava", 
    rating: 4.5, 
    reviews: 92, 
    image: "/produit/katsaka.jpg", 
    isNew: false, 
    producer: "Tiana Rakoto" 
  },
  { 
    id: 8, 
    name: "Sakamalao", 
    category: "Legioma", 
    price: 5500, 
    unit: "kg", 
    location: "Analamanga", 
    rating: 4.8, 
    reviews: 145, 
    image: "/produit/sakamalao.jpg",
    isNew: true, 
    producer: "Zo Andria" 
  },
];

const categories = ["Rehetra", "Vary", "Legioma", "Voankazo", "Ronono", "Tantely", "Biby"];
const regions = ["Rehetra", "Alaotra", "Vakinankaratra", "Diana", "Analamanga", "Haute Matsiatra"];

// Composant ProductImage avec fallback
const ProductImage = ({ src, alt, isNew, viewMode }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Générer un emoji basé sur la catégorie pour le fallback
  const getFallbackEmoji = (category) => {
    const emojiMap = {
      'Vary': '🍚',
      'Legioma': '🥬',
      'Voankazo': '🍊',
      'Ronono': '🥛',
      'Tantely': '🍯',
      'Biby': '🐄',
      'default': '📦'
    };
    return emojiMap[category] || emojiMap.default;
  };

  const fallbackEmoji = getFallbackEmoji(alt.split(' ')[0]); // Prend le premier mot comme catégorie approximative

  return (
    <div className={`relative bg-gradient-to-br from-muted to-muted/50 overflow-hidden ${
      viewMode === "list" ? "w-40 h-40 flex-shrink-0" : "aspect-square"
    }`}>
      {/* Badge Nouveau */}
      {isNew && !imgError && (
        <span className="absolute top-3 left-3 px-2 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full z-10">
          Vaovao
        </span>
      )}

      {/* Loader */}
      {isLoading && !imgError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}

      {/* Image ou fallback */}
      {imgError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <span className={`${viewMode === "list" ? "text-4xl" : "text-5xl"} mb-2`}>
            {fallbackEmoji}
          </span>
          <p className="text-xs text-muted-foreground text-center">Tsy misy sary</p>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Bouton Favori */}
      <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground z-10">
        <Heart className="w-4 h-4" />
      </button>
    </div>
  );
};

const Marketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState("Rehetra");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Header avec recherche */}
        <div className="bg-gradient-hero py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Tsena
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-xl">
              Tadiavo ny vokatra ilainao avy amin'ny mpamboly Malagasy
            </p>

            {/* Barre de recherche */}
            <div className="mt-8 bg-card rounded-2xl p-2 max-w-3xl shadow-lg">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Mitady vokatra..."
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select className="w-full sm:w-40 h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary appearance-none cursor-pointer">
                      {regions.map((region) => (
                        <option key={region}>{region}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <Button variant="hero" size="lg" className="h-12 px-6">
                    Hikaroka
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="container mx-auto px-4 py-8">
          {/* Barre d'outils */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            {/* Catégories */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Options d'affichage */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Sivana
              </Button>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-card shadow-sm" : ""}`}
                  aria-label="Affichage en grille"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-card shadow-sm" : ""}`}
                  aria-label="Affichage en liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Compteur de résultats */}
          <p className="text-muted-foreground mb-6">
            <span className="font-semibold text-foreground">{products.length}</span> vokatra hita
          </p>

          {/* Grille de produits */}
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
            {products.map((product, index) => (
              <div
                key={product.id}
                className={`group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-scale-in ${
                  viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Image avec composant ProductImage */}
                <ProductImage 
                  src={product.image}
                  alt={product.name}
                  isNew={product.isNew}
                  viewMode={viewMode}
                />

                {/* Contenu */}
                <div className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-between" : ""}`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-secondary text-secondary" />
                        <span className="text-xs font-medium">{product.rating}</span>
                        <span className="text-xs text-muted-foreground">({product.reviews})</span>
                      </div>
                    </div>

                    <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <span>{product.producer}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {product.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <span className="font-display font-bold text-lg text-primary">
                        Ar {product.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">/{product.unit}</span>
                    </div>
                    <Button variant="hero" size="sm" className="gap-1.5">
                      <ShoppingCart className="w-3 h-3" />
                      Hividiana
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Voir plus */}
          <div className="text-center mt-10">
            <Button variant="outline" size="lg">
              Hijery bebe kokoa
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;