const LOGOS = [
  { name: "Thales", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/thales66cd98d746fb3_150_150.jpg" },
  { name: "EDF", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/edf66bc7f8ead2dc_150_150.png" },
  { name: "Decathlon", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/decathlon66bc7f8eb1fff_150_150.png" },
  { name: "SNCF", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/sncf66bc7f8ea0415_150_150.jpg" },
  { name: "Orange", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/orange66bc7f90f39cc_150_150.jpg" },
  { name: "BNP", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/bnp66bc7f9046dae_150_150.jpg" },
  { name: "Groupama", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/groupama66bc7f8eb2fa0_150_150.png" },
  { name: "Hermès", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/hermes66bc7f8eaac82_150_150.png" },
  { name: "RATP", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/ratp66bc7f9033ebe_150_150.jpg" },
  { name: "Louis Vuitton", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/vuittton66bc7f905104b_150_150.jpg" },
  { name: "La Banque Postale", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/labanquepostale66bc7f906aded_150_150.jpg" },
  { name: "Saint-Gobain", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/saint-gobain66bc7f901b412_150_150.jpg" },
  { name: "Novo Nordisk", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/novo-nordisk66d553e862e39_150_150.jpg" },
  { name: "Spie", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/spie66bc7f8ea9305_150_150.png" },
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
        <div className="flex animate-scroll-logos gap-14 items-center w-max">
          {doubled.map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex-shrink-0 h-20 w-36 flex items-center justify-center hover:scale-105 transition-all duration-300"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoCarousel;
