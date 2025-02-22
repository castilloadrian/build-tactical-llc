import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Activity, Users, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Dashboard</CardTitle>
          <CardDescription>Overview of current projects and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Overall Progress</p>
                <p className="text-sm text-muted-foreground">65%</p>
              </div>
              <Progress value={65} />
            </div>

            {/* Projects List */}
            <div className="space-y-4">
              {['Project Alpha', 'Project Beta', 'Project Gamma'].map((project) => (
                <div key={project} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{project}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
