export default function GovernmentDirectory() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8 text-foreground text-center animate-fade-in-up">
        Government <span className="text-accent">Organizations</span>
      </h1>
      
      <div className="grid gap-8 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] max-w-2xl mx-auto text-center">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Federal Agencies</h2>
          <p className="text-lg text-muted-foreground">
            Browse our comprehensive directory of federal government agencies and departments.
            Find detailed information about their contract opportunities and requirements.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">State & Local</h2>
          <p className="text-lg text-muted-foreground">
            Access information about state and local government organizations.
            Stay updated with regional contracting opportunities and compliance requirements.
          </p>
        </section>
      </div>
    </div>
  );
} 