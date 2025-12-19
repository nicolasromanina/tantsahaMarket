import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-display font-bold text-lg">T</span>
              </div>
              <span className="font-display font-bold text-xl">
                Tantsaha<span className="text-sidebar-primary">Market</span>
              </span>
            </Link>
            <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
              Mampifandray ny mpamboly Malagasy amin'ny mpividy. Tsena amin'ny Internet ho an'ny vokatra Malagasy.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Rohy haingana</h4>
            <ul className="space-y-3">
              {["Tsena", "Mpamboly", "Fomba fiasa", "Momba anay"].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Sokajy</h4>
            <ul className="space-y-3">
              {["Vary & Katsaka", "Legioma", "Voankazo", "Biby fiompy", "Ronono"].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Fifandraisana</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-sidebar-foreground/70">
                <MapPin className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                Antananarivo, Madagascar
              </li>
              <li className="flex items-center gap-3 text-sm text-sidebar-foreground/70">
                <Phone className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                +261 34 11 815 03
              </li>
              <li className="flex items-center gap-3 text-sm text-sidebar-foreground/70">
                <Mail className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                contact@tantsahamarket.mg
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-sidebar-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sidebar-foreground/60">
            © 2024 TantsahaMarket. Zo rehetra voatahiry.
          </p>
          <div className="flex gap-6 text-sm text-sidebar-foreground/60">
            <Link to="#" className="hover:text-sidebar-primary transition-colors">Fepetra</Link>
            <Link to="#" className="hover:text-sidebar-primary transition-colors">Tsiambaratelo</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
