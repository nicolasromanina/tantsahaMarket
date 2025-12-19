import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  UserPlus, 
  Search, 
  ShoppingCart, 
  Truck, 
  Star,
  Shield,
  MessageCircle,
  CreditCard,
  MapPin,
  CheckCircle,
  ArrowRight,
  Users,
  Leaf,
  Heart
} from "lucide-react";

const HowItWorks = () => {
  const buyerSteps = [
    {
      icon: UserPlus,
      title: "Misoratra anarana",
      description: "Mamorona kaonty maimaimpoana ary fenoy ny fampahalalana ilaina",
      color: "bg-primary"
    },
    {
      icon: Search,
      title: "Mitady vokatra",
      description: "Tadiavo ny vokatra ilainao araka ny faritra, sokajy na vidiny",
      color: "bg-secondary"
    },
    {
      icon: ShoppingCart,
      title: "Mividia",
      description: "Safidio ny vokatra tianao ary ampidiro ao amin'ny basket",
      color: "bg-accent"
    },
    {
      icon: CreditCard,
      title: "Mandoa",
      description: "Aloa amin'ny Mobile Money na fandoavam-bola hafa",
      color: "bg-primary"
    },
    {
      icon: Truck,
      title: "Mandray",
      description: "Andraso ny fandefasana na mandehana maka ny entana",
      color: "bg-secondary"
    },
    {
      icon: Star,
      title: "Manome hevitra",
      description: "Omeo naoty ny vokatra sy ny mpamboly",
      color: "bg-accent"
    }
  ];

  const producerSteps = [
    {
      icon: UserPlus,
      title: "Misoratra ho mpamboly",
      description: "Mamorona kaonty mpamboly ary fenoy ny fampahalalana momba ny fambolena",
      color: "bg-primary"
    },
    {
      icon: Shield,
      title: "Fanamarinana",
      description: "Alefaso ny antontan-taratasy ary andraso ny fanamarinana",
      color: "bg-secondary"
    },
    {
      icon: Leaf,
      title: "Ampidiro vokatra",
      description: "Ampidiro ny vokatra omena sy ny vidiny",
      color: "bg-accent"
    },
    {
      icon: MessageCircle,
      title: "Raiso ny baiko",
      description: "Raiso ny baiko avy amin'ny mpanjifa ary vonona",
      color: "bg-primary"
    },
    {
      icon: Truck,
      title: "Andefaso",
      description: "Andefaso ny vokatra na ampiasao ny mpandefasana",
      color: "bg-secondary"
    },
    {
      icon: CreditCard,
      title: "Mandray vola",
      description: "Mandray ny vola ao anatin'ny 24h aorian'ny fandefasana",
      color: "bg-accent"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Azo antoka",
      description: "Ny fifanarahana sy ny fandoavan-bola rehetra dia azo antoka"
    },
    {
      icon: MapPin,
      title: "Mivantana",
      description: "Mividy mivantana amin'ny mpamboly tsy misy mpivarotra antenantenany"
    },
    {
      icon: Leaf,
      title: "Vokatra vaovao",
      description: "Vokatra vaovao sy organika avy any ambanivohitra"
    },
    {
      icon: Users,
      title: "Fiaraha-monina",
      description: "Tohano ny mpamboly Malagasy sy ny toe-karena eto an-toerana"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-slide-up">
              Fomba Fiasa
            </h1>
            <p className="text-primary-foreground/90 text-lg md:text-xl max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Fantaro ny fomba ampiasana ny TantsahaMarket mba hifandraisan'ny mpanjifa sy ny mpamboly Malagasy
            </p>
          </div>
        </section>

        {/* Buyer Steps */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
                <ShoppingCart className="w-4 h-4" />
                Ho an'ny mpanjifa
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ahoana no fividianana?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Dingana 6 mora foana hahafahanao mividy vokatra vaovao avy amin'ny mpamboly
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buyerSteps.map((step, index) => (
                <div 
                  key={index}
                  className="relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <step.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground mb-1">
                        DINGANA {index + 1}
                      </div>
                      <h3 className="font-display font-bold text-lg text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < buyerSteps.length - 1 && index % 3 !== 2 && (
                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button variant="hero" size="lg" asChild>
                <Link to="/marketplace" className="gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Hanomboka mividy
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <div className="h-px bg-border" />
        </div>

        {/* Producer Steps */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-full text-secondary-foreground font-medium text-sm mb-4">
                <Leaf className="w-4 h-4" />
                Ho an'ny mpamboly
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ahoana no fivarotana?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Dingana 6 hahafahanao mivarotra ny vokatra anao mivantana amin'ny mpanjifa
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {producerSteps.map((step, index) => (
                <div 
                  key={index}
                  className="relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <step.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground mb-1">
                        DINGANA {index + 1}
                      </div>
                      <h3 className="font-display font-bold text-lg text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button variant="outline" size="lg" asChild className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                <Link to="/auth" className="gap-2">
                  <UserPlus className="w-5 h-5" />
                  Misoratra ho mpamboly
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nahoana no TantsahaMarket?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Tombony maro ho anao rehefa mampiasa ny TantsahaMarket
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="text-center p-6 bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all group"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                    <benefit.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Mbola manana fanontaniana?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Tsy misalasala mifandray aminay na mampiasa ny AI chatbot anay
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link to="/about" className="gap-2">
                  <Heart className="w-5 h-5" />
                  Momba anay
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <MessageCircle className="w-5 h-5 mr-2" />
                Mifandray aminay
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
