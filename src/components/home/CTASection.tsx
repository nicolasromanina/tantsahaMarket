import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Download } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary to-earth relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left animate-slide-up">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
              Midira amin'ny <br className="hidden sm:block" />
              TantsahaMarket androany
            </h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 max-w-lg mx-auto lg:mx-0">
              Alao ny application ary atombohy ny fividianana na fivarotana mivantana amin'ny mpamboly Malagasy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="harvest" size="xl" className="gap-3">
                <Download className="w-5 h-5" />
                Alao ny App
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Fantaro bebe kokoa
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-10 justify-center lg:justify-start">
              <div>
                <p className="font-display font-bold text-3xl text-secondary">10,000+</p>
                <p className="text-primary-foreground/70 text-sm">Mpampiasa</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl text-secondary">22</p>
                <p className="text-primary-foreground/70 text-sm">Faritra</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl text-secondary">4.8★</p>
                <p className="text-primary-foreground/70 text-sm">Rating</p>
              </div>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-64 h-[520px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="h-8 bg-card flex items-center justify-center">
                    <div className="w-20 h-5 bg-foreground rounded-full" />
                  </div>
                  
                  {/* App Content Preview */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">T</span>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-muted rounded" />
                        <div className="h-2 w-16 bg-muted/50 rounded mt-1" />
                      </div>
                    </div>

                    <div className="h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                      <span className="text-4xl">🌾</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {["🍚", "🥬", "🍊"].map((emoji, i) => (
                        <div key={i} className="aspect-square bg-muted rounded-xl flex items-center justify-center text-2xl">
                          {emoji}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="h-16 bg-card rounded-xl p-3 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-gradient-harvest rounded-lg flex items-center justify-center text-xl">🍯</div>
                        <div className="flex-1">
                          <div className="h-2 w-20 bg-muted rounded" />
                          <div className="h-2 w-14 bg-muted/50 rounded mt-1" />
                        </div>
                        <div className="h-3 w-12 bg-primary rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-secondary rounded-2xl p-3 shadow-lg animate-float">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  <span className="font-semibold text-secondary-foreground text-sm">+3</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl p-3 shadow-lg animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground text-sm">App vaovao</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
