import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const categories = [
  { id: 1, name: "Vary & Katsaka", icon: "🌾", count: 3420, color: "from-amber-400 to-yellow-500" },
  { id: 2, name: "Legioma", icon: "🥬", count: 2850, color: "from-green-400 to-emerald-500" },
  { id: 3, name: "Voankazo", icon: "🍊", count: 1920, color: "from-orange-400 to-red-400" },
  { id: 4, name: "Biby fiompy", icon: "🐄", count: 890, color: "from-amber-500 to-orange-500" },
  { id: 5, name: "Ronono & Atody", icon: "🥛", count: 1250, color: "from-blue-300 to-cyan-400" },
  { id: 6, name: "Hazan-tsambo", icon: "🐟", count: 760, color: "from-cyan-400 to-blue-500" },
  { id: 7, name: "Zava-maniry", icon: "🌱", count: 2100, color: "from-lime-400 to-green-500" },
  { id: 8, name: "Tantely & Ditimena", icon: "🍯", count: 430, color: "from-yellow-400 to-amber-500" },
];

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
              
              {/* Icon */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl md:text-4xl shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {category.icon}
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
