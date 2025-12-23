import { Star, Quote } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    id: 1,
    name: "Hery Andrianaivo",
    role: "Mpividy - Antananarivo",
    content: "Tena tsara ny TantsahaMarket! Mahita vokatra vaovao sy mora kokoa noho ny eny an-tsena. Ny mpamboly koa tena matoky.",
    rating: 5,
    avatar: "/testimonials/hery-andrianaivo.jpg",
  },
  {
    id: 2,
    name: "Lalaina Razafy",
    role: "Mpamboly - Alaotra",
    content: "Nahavita namidy ny variko tamin'ny vidiny tsara kokoa. Tsy mila mandeha lavitra intsony fa ny mpividy no tonga any aminay.",
    rating: 5,
    avatar: "/testimonials/lalaina-razafy.jpg", 
  },
  {
    id: 3,
    name: "Restaurant Sakamanga",
    role: "Mpividy - Antsirabe",
    content: "Tena manampy anay ity application ity. Mahita legioma vaovao isanandro ho an'ny restaurant-nay. Misaotra TantsahaMarket!",
    rating: 5,
    avatar: "/testimonials/restaurant-sakamanga.jpg", // Changé
  },
];

// Composant pour gérer les avatars des témoignages
const TestimonialAvatar = ({ src, alt, name, className }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Générer des initiales pour le fallback
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {imgError ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold">
          <span className="text-sm">{getInitials(name)}</span>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          <img 
            src={src} 
            alt={alt}
            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ny hevitry ny mpampiasa
          </h2>
          <p className="text-lg text-muted-foreground">
            Ny tenin'ny mpamboly sy mpividy efa nampiasa ny TantsahaMarket
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="relative bg-card rounded-2xl p-6 md:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 animate-scale-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Quote className="w-5 h-5 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <TestimonialAvatar 
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  name={testimonial.name} className={undefined}                />
                <div>
                  <p className="font-display font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Plus de témoignages (optionnel) */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Mihoatra ny <span className="font-bold text-primary">500+</span> mpampiasa mahatoky
          </p>
          {/* Mini avatars carousel */}
          <div className="flex justify-center items-center gap-2">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-bold text-primary"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-2">+ sns.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;