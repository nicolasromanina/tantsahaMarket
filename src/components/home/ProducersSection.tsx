import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, MapPin, CheckCircle, ShieldCheck } from "lucide-react";

const producers = [
  {
    id: 1,
    name: "Rakoto Jean",
    specialty: "Vary & Katsaka",
    location: "Alaotra-Mangoro",
    rating: 4.9,
    products: 45,
    verified: true,
    avatar: "👨‍🌾",
    sales: "500+ vokatra namidy",
  },
  {
    id: 2,
    name: "Rasoa Marie",
    specialty: "Legioma organika",
    location: "Vakinankaratra",
    rating: 4.8,
    products: 32,
    verified: true,
    avatar: "👩‍🌾",
    sales: "350+ vokatra namidy",
  },
  {
    id: 3,
    name: "Andry Cooperative",
    specialty: "Voankazo",
    location: "Diana",
    rating: 4.9,
    products: 78,
    verified: true,
    avatar: "🌾",
    sales: "1,200+ vokatra namidy",
  },
  {
    id: 4,
    name: "Faly Farm",
    specialty: "Ronono & Atody",
    location: "Itasy",
    rating: 4.7,
    products: 28,
    verified: true,
    avatar: "🐄",
    sales: "280+ vokatra namidy",
  },
];

const ProducersSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Mpamboly malaza
            </h2>
            <p className="text-muted-foreground mt-2">Mpamboly voamarina sy matoky</p>
          </div>
          <Link 
            to="/producers" 
            className="group flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            Hijery rehetra
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Producers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {producers.map((producer, index) => (
            <Link
              key={producer.id}
              to={`/producer/${producer.id}`}
              className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Avatar & Badge */}
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-5xl mx-auto group-hover:scale-105 transition-transform">
                  {producer.avatar}
                </div>
                {producer.verified && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-primary-foreground" />
                    <span className="text-[10px] font-semibold text-primary-foreground">Voamarina</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="font-display font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                  {producer.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{producer.specialty}</p>

                {/* Location */}
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  {producer.location}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-semibold text-foreground">{producer.rating}</span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{producer.products} vokatra</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-12 bg-gradient-hero rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Mpamboly ve ianao?
            </h3>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-6">
              Midira ao amin'ny TantsahaMarket ary varotana mivantana ny vokatrao amin'ny mpividy maro
            </p>
            <Button variant="harvest" size="lg" className="gap-2">
              Misoratra anarana izao
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProducersSection;
