import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Hery Andrianaivo",
    role: "Mpividy - Antananarivo",
    content: "Tena tsara ny TantsahaMarket! Mahita vokatra vaovao sy mora kokoa noho ny eny an-tsena. Ny mpamboly koa tena matoky.",
    rating: 5,
    avatar: "👨",
  },
  {
    id: 2,
    name: "Lalaina Razafy",
    role: "Mpamboly - Alaotra",
    content: "Nahavita namidy ny variko tamin'ny vidiny tsara kokoa. Tsy mila mandeha lavitra intsony fa ny mpividy no tonga any aminay.",
    rating: 5,
    avatar: "👩‍🌾",
  },
  {
    id: 3,
    name: "Restaurant Sakamanga",
    role: "Mpividy - Antsirabe",
    content: "Tena manampy anay ity application ity. Mahita legioma vaovao isanandro ho an'ny restaurant-nay. Misaotra TantsahaMarket!",
    rating: 5,
    avatar: "🍽️",
  },
];

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
              className="relative bg-card rounded-2xl p-6 md:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Quote className="w-5 h-5 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
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
      </div>
    </section>
  );
};

export default TestimonialsSection;
