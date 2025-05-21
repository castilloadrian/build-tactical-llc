export default function Blog() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8 text-foreground text-center animate-fade-in-up">
        Latest <span className="text-accent">Insights</span>
      </h1>
      
      <div className="grid gap-8 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] max-w-2xl mx-auto text-center">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Industry News</h2>
          <p className="text-lg text-muted-foreground">
            Stay informed with the latest updates in government contracting, policy changes,
            and industry trends. Our expert analysis helps you navigate the complex landscape.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Best Practices</h2>
          <p className="text-lg text-muted-foreground">
            Discover tips, strategies, and success stories from experienced contractors
            and government agencies. Learn how to optimize your contracting process.
          </p>
        </section>
      </div>
    </div>
  );
} 