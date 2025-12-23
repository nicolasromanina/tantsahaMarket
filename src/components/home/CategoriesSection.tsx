import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

const categories = [
  { 
    id: 1, 
    name: "Vary & Tsaramaso", 
    image: "/produit/vary-mainty.jpg", 
    count: 3420, 
    color: "from-amber-400 to-yellow-500" 
  },
  { 
    id: 2, 
    name: "Legioma", 
    image: "/produit/legioma.jpg", 
    count: 2850, 
    color: "from-green-400 to-emerald-500" 
  },
  { 
    id: 3, 
    name: "Voankazo", 
    image: "/produit/voan-kazo.jpg", 
    count: 1920, 
    color: "from-orange-400 to-red-400" 
  },
  { 
    id: 4, 
    name: "Biby fiompy", 
    image: "/produit/biby-fiompy.jpg", 
    count: 890, 
    color: "from-amber-500 to-orange-500" 
  },
  { 
    id: 5, 
    name: "Ronono & Fromazy", 
    image: "/produit/ronono.jpg", 
    count: 1250, 
    color: "from-blue-300 to-cyan-400" 
  },
  { 
    id: 6, 
    name: "Tongolo & Sakay", 
    image: "/produit/tongolo.jpg", 
    count: 760, 
    color: "from-cyan-400 to-blue-500" 
  },
  { 
    id: 7, 
    name: "Lavanila & Jirofo", 
    image: "/produit/lavanila.jpg", 
    count: 2100, 
    color: "from-lime-400 to-green-500" 
  },
  { 
    id: 8, 
    name: "Tantely", 
    image: "/produit/tantely.jpg", 
    count: 430, 
    color: "from-yellow-400 to-amber-500" 
  },
];

// Composant pour gérer les images avec fallback
const CategoryImage = ({ src, alt, className, color }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${color}`}>
        <span className="text-2xl md:text-3xl opacity-70">📦</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

const CategoriesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Sokajy malaza
            </h2>
            <p className="text-muted-foreground mt-2">Safidio ny vokatra tianao</p>
          </div>
          <Link 
            to="/categories" 
            className="group flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            Hijery rehetra
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="group relative bg-card rounded-2xl p-5 md:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-scale-in overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Image Container */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                <CategoryImage 
                  src={category.image} 
                  alt={category.name}
                  color={category.color}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-foreground text-base md:text-lg mb-1">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {category.count.toLocaleString()} vokatra
              </p>

              {/* Arrow */}
              <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-primary">
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;