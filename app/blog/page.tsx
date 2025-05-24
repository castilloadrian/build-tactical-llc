import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Newspaper, Lightbulb } from 'lucide-react';

export default function Blog() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-5xl font-bold mb-6 text-foreground">
          Latest <span className="text-accent">Insights</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Stay informed with expert analysis, industry trends, and best practices in government contracting
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
        
        {/* Industry News Card */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Newspaper className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl">Industry News</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Stay informed with the latest updates in government contracting, policy changes,
              and industry trends. Our expert analysis helps you navigate the complex landscape.
            </p>
          </CardContent>
        </Card>

        {/* Best Practices Card */}
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl">Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Discover tips, strategies, and success stories from experienced contractors
              and government agencies. Learn how to optimize your contracting process.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
} 