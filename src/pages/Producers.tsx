import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAllProducers } from "@/hooks/useProducer";
import { 
  Search, 
  MapPin, 
  Star, 
  ChevronDown,
  Users,
  Leaf,
  Award,
  Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const regions = [
  "Rehetra",
  "Analamanga",
  "Vakinankaratra",
  "Alaotra-Mangoro",
  "Diana",
  "Haute Matsiatra",
  "Atsimo-Andrefana",
  "Boeny"
];

const Producers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Rehetra");
  const { data: producers, isLoading } = useAllProducers();

  const filteredProducers = producers?.filter(producer => {
    const matchesSearch = producer.farm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producer.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === "Rehetra" || producer.profile?.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Mpamboly
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-xl mb-8">
              Fantaro ny mpamboly Malagasy sy ny vokatra tsara indrindra avy any aminy
            </p>

            {/* Search Bar */}
            <div className="bg-card rounded-2xl p-2 max-w-3xl shadow-lg">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Mitady mpamboly..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select 
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full sm:w-44 h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary appearance-none cursor-pointer"
                    >
                      {regions.map((region) => (
                        <option key={region}>{region}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Users className="w-5 h-5" />
                  <span className="font-display text-2xl font-bold">{producers?.length || 0}</span>
                </div>
                <span className="text-sm text-muted-foreground">Mpamboly</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-secondary mb-1">
                  <Award className="w-5 h-5" />
                  <span className="font-display text-2xl font-bold">4.8</span>
                </div>
                <span className="text-sm text-muted-foreground">Naoty antonony</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-accent mb-1">
                  <Leaf className="w-5 h-5" />
                  <span className="font-display text-2xl font-bold">80%</span>
                </div>
                <span className="text-sm text-muted-foreground">Organika</span>
              </div>
            </div>
          </div>
        </section>

        {/* Producers Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredProducers?.length || 0}</span> mpamboly hita
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Sivana
              </Button>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 shadow-card">
                    <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducers?.map((producer, index) => (
                  <Link
                    key={producer.id}
                    to={`/producer/${producer.id}`}
                    className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Avatar */}
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      {producer.profile?.avatar_url ? (
                        <img 
                          src={producer.profile.avatar_url} 
                          alt={producer.profile.full_name || ''} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">👨‍🌾</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <h3 className="font-display font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                        {producer.farm_name || producer.profile?.full_name || 'Mpamboly'}
                      </h3>
                      
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-3">
                        <MapPin className="w-3 h-3" />
                        {producer.profile?.region || 'Madagascar'}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-secondary text-secondary" />
                          <span className="font-medium">{producer.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <span className="text-muted-foreground text-sm">
                          ({producer.total_reviews || 0} avis)
                        </span>
                      </div>

                      {/* Products */}
                      {producer.main_products && producer.main_products.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mb-4">
                          {producer.main_products.slice(0, 3).map((product, i) => (
                            <span 
                              key={i}
                              className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground"
                            >
                              {product}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Certifications */}
                      {producer.certifications && producer.certifications.length > 0 && (
                        <div className="flex items-center justify-center gap-1">
                          <Award className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">
                            {producer.certifications.length} certification{producer.certifications.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {filteredProducers?.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Tsy misy mpamboly hita
                </h3>
                <p className="text-muted-foreground mb-6">
                  Ovao ny sivana na ny teny fikarohana
                </p>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedRegion('Rehetra'); }}>
                  Avereno ny sivana
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Te-ho lasa mpamboly ve ianao?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Midira amin'ny fiaraha-monina anay ary varotio ny vokatra anao mivantana
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/auth">
                Misoratra ho mpamboly
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Producers;
