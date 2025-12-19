import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Heart, 
  Target, 
  Users, 
  Leaf, 
  Globe, 
  Award,
  TrendingUp,
  Shield,
  MapPin,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";

const About = () => {
  const stats = [
    { value: "5,000+", label: "Mpamboly" },
    { value: "50,000+", label: "Mpanjifa" },
    { value: "22", label: "Faritra" },
    { value: "100,000+", label: "Vokatra" }
  ];

  const values = [
    {
      icon: Heart,
      title: "Fahamarinana",
      description: "Mampifandray mivantana ny mpamboly sy ny mpanjifa amin'ny fomba mahitsy"
    },
    {
      icon: Leaf,
      title: "Fiarovana ny tontolo iainana",
      description: "Mamporisika ny fambolena maharitra sy ny vokatra organika"
    },
    {
      icon: Users,
      title: "Fiaraha-monina",
      description: "Manorina fiaraha-monina matanjaka ho an'ny mpamboly Malagasy"
    },
    {
      icon: Shield,
      title: "Fahatokisana",
      description: "Miantoka ny kalitao sy ny azo antoka amin'ny fifanakalozana rehetra"
    }
  ];

  const team = [
    {
      name: "Nicolas ROMANINA",
      role: "Mpanorina & CEO",
      image: "/team/nicolas.png"
    },
    {
      name: "Present ANDRIANAHAZO",
      role: "Tompon'andraikitra ara-teknika",
      image: "/team/present.jpg"
    },
    {
      name: "Jess RANDRIANARIVELO",
      role: "Tompon'andraikitra ara-barotra",
      image: "/team/jess.jpg"
    },
    {
      name: "Noro FANIVONIMANANA",
      role: "Tompon'andraikitra ara-pitantanana",
      image: "/team/noro.jpg"
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
              Momba ny TantsahaMarket
            </h1>
            <p className="text-primary-foreground/90 text-lg md:text-xl max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Sehatra nataonay hampifandray mivantana ny mpamboly Malagasy sy ny mpanjifa, mba hisian'ny fividianana sy fivarotana marina
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 -mt-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-2xl p-6 text-center shadow-lg animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
                  <Globe className="w-4 h-4" />
                  Ny tantaranay
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Naorina tamin'ny 2024 ho fanohanana ny mpamboly Malagasy
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Ny TantsahaMarket dia noforonina tamin'ny fitiavana lalina ny tany sy ny olona miasa amin'ny fambolena eto Madagasikara. Hitanay fa betsaka ny mpamboly no sahirana amin'ny fivarotana ny vokany, satria tsy afaka mivarotra mivantana amin'ny mpanjifa.
                  </p>
                  <p>
                    Izany no nanosika anay hamorona sehatra iray izay hampifandray mivantana ny mpamboly sy ny mpanjifa, ka hahafahana mivarotra sy mividy amin'ny vidiny marina, tsy misy mpivarotra antenantenany.
                  </p>
                  <p>
                    Ankehitriny, ny TantsahaMarket dia lasa sehatra lehibe indrindra ho an'ny vokatra voalohany eto Madagasikara, ka mampifandray mpamboly an'arivony manerana ny Nosy sy mpanjifa maro.
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center">
                    <span className="text-9xl">🌾</span>
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-5xl">🇲🇬</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-2xl p-8 shadow-card">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                  Ny tanjona
                </h3>
                <p className="text-muted-foreground">
                  Hampifandray mivantana ny mpamboly Malagasy sy ny mpanjifa, mba hisian'ny fividianana sy fivarotana marina, ary hanampiana ny mpamboly hahazo tombontsoa tsara kokoa amin'ny asany.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 shadow-card">
                <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-7 h-7 text-secondary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                  Ny nofinofy
                </h3>
                <p className="text-muted-foreground">
                  Ho lasa sehatra fampifandraisana lehibe indrindra ho an'ny vokatra voalohany eto Madagasikara, ka hampandroso ny toe-karena eto an-toerana sy hanatsara ny fiainan'ny mpamboly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ny soatoavina anay
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Ireto no fototry ny asa rehetra ataonay
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="text-center p-6 bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all group"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors">
                    <value.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ny ekipa
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Olona mafy orina sy matihanina izay miara-miasa mba hahatontosana ny tanjona
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <div 
                  key={index}
                  className="text-center p-6 bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all group"
                >
                 <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <img 
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Mifandraisa aminay
                </h2>
                <p className="text-muted-foreground">
                  Tsy misalasala mifandray aminay raha misy fanontaniana na soso-kevitra
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-card">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Mailaka</div>
                    <div className="font-medium">contact@tantsahamarket.mg</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-card">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Finday</div>
                    <div className="font-medium">+261 34 11 815 03</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-card">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Adiresy</div>
                    <div className="font-medium">Antananarivo, Madagascar</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground mb-4">Araho izahay</p>
                <div className="flex justify-center gap-4">
                  <a href="#" className="w-12 h-12 bg-card rounded-xl shadow-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-12 h-12 bg-card rounded-xl shadow-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-12 h-12 bg-card rounded-xl shadow-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Vonona ve ianao?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Miaraha aminay amin'ny fanohanana ny mpamboly Malagasy sy ny toe-karena eto an-toerana
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link to="/marketplace" className="gap-2">
                  Hanomboka mividy
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/auth">
                  Misoratra ho mpamboly
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
