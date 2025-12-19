import { Button } from "@/components/ui/button";
import { Search, MapPin, ArrowRight, Leaf, Users, TrendingUp, ChevronDown } from "lucide-react";
import { useState } from "react";

const HeroSection = () => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden">
      {/* Background Pattern - Plus subtil */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      <div 
        className="absolute inset-0 opacity-5 md:opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h80v80H0V0zm20 20v40h40V20H20zm20 35a15 15 0 1 1 0-30 15 15 0 0 1 0 30z' fill='%23228B22' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Floating Elements - Optimisé mobile */}
      <div className="absolute top-20 left-4 w-16 h-16 bg-secondary/20 rounded-full blur-xl animate-float md:top-32 md:left-10 md:w-20 md:h-20 md:blur-2xl" />
      <div className="absolute bottom-20 right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl animate-float md:bottom-32 md:right-10 md:w-32 md:h-32 md:blur-3xl" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/3 right-8 w-12 h-12 bg-accent/15 rounded-full blur-xl animate-float md:top-1/2 md:right-1/4 md:w-16 md:h-16 md:blur-2xl" style={{ animationDelay: "4s" }} />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-6 md:space-y-8 animate-slide-up">
            {/* Badge amélioré */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium backdrop-blur-sm border border-primary/20">
              <Leaf className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="truncate">Tsena voalohany ho an'ny tantsaha Malagasy</span>
            </div>

            {/* Titre optimisé mobile */}
            <div className="space-y-2 md:space-y-4">
              <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Varotra ny
                <span className="text-gradient-primary block mt-1 md:mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-secondary">
                  vokatra Malagasy
                </span>
                <span className="block mt-1 md:mt-2">mivantana</span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Mampifandray ny mpamboly amin'ny mpividy. Vidio ny vokatra tsara indrindra avy any an-tanàna mivantana.
              </p>
            </div>

            {/* Search Box amélioré */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-border/50 max-w-xl">
              <div className={`flex flex-col gap-2 transition-all duration-300 ${isSearchExpanded ? 'pb-2' : ''}`}>
                {/* Barre de recherche principale */}
                <div className="relative flex items-center">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Inona no tadiavinao?"
                    className="w-full h-12 pl-11 pr-12 md:pl-12 md:pr-4 rounded-xl bg-background/80 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base"
                    onFocus={() => setIsSearchExpanded(true)}
                    onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                  />
                  {/* Bouton recherche mobile */}
                  <Button 
                    variant="hero" 
                    size="icon"
                    className="md:hidden absolute right-2 h-8 w-8 rounded-lg"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {/* Champs supplémentaires */}
                <div className={`flex flex-col sm:flex-row gap-2 transition-all duration-300 ${isSearchExpanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 overflow-hidden md:max-h-full md:opacity-100'}`}>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground pointer-events-none" />
                    <select 
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-background/80 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base appearance-none cursor-pointer"
                      defaultValue=""
                    >
                      <option value="">Safidy faritra</option>
                      <option value="antananarivo">Antananarivo</option>
                      <option value="antsirabe">Antsirabe</option>
                      <option value="fianarantsoa">Fianarantsoa</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="h-12 px-4 md:px-6 flex-1 sm:flex-none"
                  >
                    <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="hidden sm:inline">Hikaroka</span>
                    <span className="sm:hidden">Hikaroka</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats optimisé mobile */}
            <div className="flex flex-wrap gap-4 md:gap-8 pt-2 md:pt-4">
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl md:text-2xl text-foreground">2,500+</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Mpamboly</p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 md:w-6 md:h-6 text-earth" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl md:text-2xl text-foreground">15,000+</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Vokatra</p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl md:text-2xl text-foreground">98%</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Fahafaham-po</p>
                </div>
              </div>
            </div>

            {/* Call to Action supplémentaire */}
            <div className="pt-2 md:pt-4">
              <Button 
                variant="outline" 
                className="group h-11 px-6 border-primary/30 hover:border-primary hover:bg-primary/5"
              >
                <span>Hijery ny vokatra rehetra</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Hero Image/Illustration - Optimisé mobile */}
          <div className="relative animate-fade-in mt-8 lg:mt-0" style={{ animationDelay: "0.3s" }}>
            <div className="relative">
              {/* Main Card */}
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg md:shadow-card-hover border border-border/50 relative z-10">
                <div className="aspect-[4/3] rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                  <div className="text-center p-4 md:p-8">
                    <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 rounded-full bg-gradient-hero flex items-center justify-center shadow-glow">
                      <Leaf className="w-8 h-8 md:w-12 md:h-12 text-primary-foreground" />
                    </div>
                    <p className="font-display font-bold text-lg md:text-2xl text-foreground">Vokatra vaovao</p>
                    <p className="text-sm text-muted-foreground mt-1 md:mt-2">Avy any an-tanàna</p>
                  </div>
                </div>
                
                {/* Featured Product Preview */}
                <div className="mt-3 md:mt-4 flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-muted/30">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl bg-gradient-harvest flex items-center justify-center flex-shrink-0">
                    <span className="text-xl md:text-2xl">🍚</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">Vary gasy</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Alaotra • 50kg</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="w-3 h-3 md:w-4 md:h-4 bg-yellow-400/80 rounded-full" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">(45)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-primary text-base md:text-lg">Ar 2,500</p>
                    <p className="text-xs text-muted-foreground">/kg</p>
                  </div>
                </div>

                {/* Action Button sur la carte */}
                <Button 
                  variant="ghost" 
                  className="w-full mt-3 md:mt-4 h-10 text-primary hover:text-primary hover:bg-primary/5"
                >
                  Jereo antsinjarany
                </Button>
              </div>

              {/* Floating Badges - Position optimisée mobile */}
              <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-secondary/90 backdrop-blur-sm rounded-xl md:rounded-2xl p-2 md:p-4 shadow-lg animate-float z-20">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-secondary-foreground/10 flex items-center justify-center">
                    <span className="text-sm md:text-lg">🌿</span>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-secondary-foreground/70">Vaovao androany</p>
                    <p className="font-semibold text-secondary-foreground text-sm md:text-base">+128 vokatra</p>
                  </div>
                </div>
              </div>

              {/* Location Badge */}
              <div className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 bg-card/90 backdrop-blur-sm rounded-xl md:rounded-2xl p-2 md:p-4 shadow-lg animate-float z-20" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  <span className="font-medium text-foreground text-sm md:text-base">22 Faritra</span>
                </div>
              </div>

              {/* Floating Price Tag */}
              <div className="absolute -bottom-6 right-1/4 bg-accent text-accent-foreground rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg animate-bounce z-20">
                -30% amin'ny fivarotana voalohany
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
        <div className="animate-bounce flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">Hidina midina</span>
          <ChevronDown className="w-5 h-5 text-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;