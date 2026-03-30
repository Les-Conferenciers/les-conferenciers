const LOGOS = [
  { name: "Thales", src: "/logos/thales66cd98d746fb3.jpg" },
  { name: "EDF", src: "/logos/edf66bc7f8ead2dc.png" },
  { name: "Decathlon", src: "/logos/decathlon66bc7f8eb1fff.png" },
  { name: "SNCF", src: "/logos/sncf66bc7f8ea0415.jpg" },
  { name: "Orange", src: "/logos/orange66bc7f90f39cc.jpg" },
  { name: "BNP", src: "/logos/bnp66bc7f9046dae.jpg" },
  { name: "Groupama", src: "/logos/groupama66bc7f8eb2fa0.png" },
  { name: "Hermès", src: "/logos/hermes66bc7f8eaac82.png" },
  { name: "RATP", src: "/logos/ratp66bc7f9033ebe.jpg" },
  { name: "Louis Vuitton", src: "/logos/vuittton66bc7f905104b.jpg" },
  { name: "La Banque Postale", src: "/logos/labanquepostale66bc7f906aded.jpg" },
  { name: "Saint-Gobain", src: "/logos/saint-gobain66bc7f901b412.jpg" },
  { name: "Novo Nordisk", src: "/logos/novo-nordisk66d553e862e39.jpg" },
  { name: "Spie", src: "/logos/spie66bc7f8ea9305.png" },
];

const LogoCarousel = () => {
  const doubled = [...LOGOS, ...LOGOS];

  return (
    <section className="py-16 bg-card border-y border-border/40 overflow-hidden">
      <div className="container mx-auto px-4 mb-10">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-center text-foreground">
          Ils nous font confiance
        </h2>
        <p className="text-center text-muted-foreground mt-2">
          Plus de 500 entreprises nous ont déjà fait confiance
        </p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-card to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-card to-transparent z-10" />
        <div className="flex animate-scroll-logos gap-14 items-center w-max will-change-transform">
          {doubled.map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex-shrink-0 h-24 w-44 flex items-center justify-center hover:scale-105 transition-all duration-300"
            >
              <img
                src={logo.src}
                alt={`Logo ${logo.name} - client de notre agence de conférenciers`}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
                decoding="async"
                width={176}
                height={96}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoCarousel;
