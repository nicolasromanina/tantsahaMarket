import { Search, ShoppingCart, Truck, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Mitadiava",
    description: "Tadiavo ny vokatra ilainao amin'ny faritra tianao",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: ShoppingCart,
    title: "Mividiana",
    description: "Safidio ny vokatra ary ampidiro ao amin'ny harona",
    color: "bg-secondary/30 text-earth",
  },
  {
    icon: Truck,
    title: "Alefa",
    description: "Ny mpamboly no manomana sy mandefa ny vokatra",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: CheckCircle,
    title: "Raisina",
    description: "Raiso ny vokatra vaovao ary omeo hevitra",
    color: "bg-sky/10 text-sky",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Fomba fiasa
          </h2>
          <p className="text-lg text-muted-foreground">
            Mora sy haingana ny fividianana vokatra avy amin'ny mpamboly Malagasy
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative text-center animate-slide-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent" />
              )}

              {/* Icon */}
              <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-5 shadow-card`}>
                <step.icon className="w-9 h-9" />
              </div>

              {/* Step Number */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center font-display font-bold text-sm text-primary shadow-sm">
                {index + 1}
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
