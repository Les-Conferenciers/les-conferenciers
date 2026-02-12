import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { blogArticles } from "@/lib/blogData";
import { Calendar, Clock, ArrowRight, ChevronRight } from "lucide-react";
import { useEffect } from "react";

const Blog = () => {
  useEffect(() => {
    document.title = "Blog | Agence - Les Conférenciers";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Découvrez nos articles sur le management, la transformation et l'engagement environnemental en entreprise.");
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const [featured, ...rest] = blogArticles;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <nav className="flex items-center gap-1.5 text-sm text-primary-foreground/60 mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-accent transition-colors">Accueil</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary-foreground font-medium">Blog</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3">
            Le Blog
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl">
            Inspirations, tendances et conseils pour vos événements d'entreprise.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl flex-grow">
        {/* Featured article */}
        <Link
          to={`/blog/${featured.slug}`}
          className="group block mb-16"
        >
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-border/40">
              <img
                src={featured.image}
                alt={featured.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                {featured.category}
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
                {featured.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(featured.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {featured.readTime}
                </span>
              </div>
              <span className="inline-flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
                Lire l'article <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </article>
        </Link>

        {/* Other articles */}
        {rest.length > 0 && (
          <>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-8 flex items-center gap-3">
              <span className="w-1 h-7 bg-accent rounded-full block" />
              Tous les articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {rest.map((article) => (
                <Link
                  key={article.slug}
                  to={`/blog/${article.slug}`}
                  className="group block"
                >
                  <article className="bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-lg hover:border-accent/20 transition-all duration-300">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                          {article.category}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(article.date)}
                        </span>
                        <span className="text-accent text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          Lire <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
