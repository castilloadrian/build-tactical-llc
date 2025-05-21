export default function ContractorDirectory() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8 text-foreground text-center animate-fade-in-up">
        Contractor <span className="text-accent">Directory</span>
      </h1>
      
      <div className="grid gap-8 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] max-w-2xl mx-auto text-center">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Verified Contractors</h2>
          <p className="text-lg text-muted-foreground">
            Browse our network of verified government contractors. Each profile includes
            past performance, certifications, and areas of expertise.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Specialized Services</h2>
          <p className="text-lg text-muted-foreground">
            Find contractors specializing in various sectors including IT, construction,
            professional services, and more. Filter by expertise, location, and contract history.
          </p>
        </section>
      </div>
    </div>
  );
} 