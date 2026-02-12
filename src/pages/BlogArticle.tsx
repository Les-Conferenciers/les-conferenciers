import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getArticleBySlug, blogArticles } from "@/lib/blogData";
import { Calendar, Clock, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect } from "react";

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = getArticleBySlug(slug || "");

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | Blog - Les Conférenciers`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", article.excerpt);
    }
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article non trouvé</h1>
            <Button onClick={() => navigate("/blog")}>Retour au blog</Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const otherArticles = blogArticles.filter((a) => a.slug !== article.slug).slice(0, 2);

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, idx) => {
      if (block.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl font-serif font-bold text-foreground mt-10 mb-4 flex items-center gap-3">
            <span className="w-1 h-6 bg-accent rounded-full block" />
            {block.replace("## ", "")}
          </h2>
        );
      }
      if (block.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-serif font-bold text-foreground mt-8 mb-3">
            {block.replace("### ", "")}
          </h3>
        );
      }
      if (block.startsWith("- ")) {
        const items = block.split("\n").filter((l) => l.startsWith("- "));
        return (
          <ul key={idx} className="space-y-2 my-4">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2.5 flex-shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: item.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }} />
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p
          key={idx}
          className="text-muted-foreground leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <nav className="flex items-center gap-1.5 text-sm text-primary-foreground/60 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-accent transition-colors">Accueil</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/blog" className="hover:text-accent transition-colors">Blog</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary-foreground font-medium truncate max-w-[200px]">{article.title}</span>
          </nav>

          <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20 mb-4">
            {article.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-primary-foreground/60">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(article.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {article.readTime} de lecture
            </span>
          </div>
        </div>
      </section>

      {/* Featured image */}
      <div className="container mx-auto max-w-3xl px-4 -mt-6">
        <div className="aspect-[16/7] rounded-2xl overflow-hidden border border-border/40 shadow-lg">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Article content */}
      <article className="container mx-auto max-w-3xl px-4 py-12 flex-grow">
        <div className="prose-custom">
          {renderContent(article.content)}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-primary text-primary-foreground rounded-2xl p-8 text-center">
          <h3 className="font-serif font-bold text-xl mb-2">Besoin d'un conférencier sur ce sujet ?</h3>
          <p className="text-primary-foreground/70 text-sm mb-5 max-w-md mx-auto">
            Contactez-nous pour trouver le conférencier idéal pour votre prochain événement.
          </p>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl gap-2"
            onClick={() => navigate("/contact")}
          >
            Demander un devis
          </Button>
        </div>

        {/* Related articles */}
        {otherArticles.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-8 flex items-center gap-3">
              <span className="w-1 h-7 bg-accent rounded-full block" />
              Articles similaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherArticles.map((a) => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="group block">
                  <article className="bg-card border border-border/40 rounded-xl overflow-hidden hover:shadow-md hover:border-accent/20 transition-all">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={a.image} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                    <div className="p-5 space-y-2">
                      <span className="text-xs text-accent font-semibold">{a.category}</span>
                      <h3 className="font-bold text-foreground group-hover:text-accent transition-colors leading-snug text-sm">
                        {a.title}
                      </h3>
                      <span className="text-accent text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Lire <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </div>
  );
};

export default BlogArticle;
