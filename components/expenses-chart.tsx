import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface ExpensesChartProps {
  projectId: number;
  expenses: Array<{
    id: number;
    description: string;
    amount: string;
    date: string;
  }>;
  isLoading: boolean;
  budget: number;
}

export function ExpensesChart({ projectId, expenses, isLoading, budget }: ExpensesChartProps) {
  // Process the expenses data for the chart
  const processedExpenses = expenses.map(expense => ({
    id: expense.id,
    description: expense.description || 'Unnamed Expense',
    amount: parseFloat(expense.amount) || 0,
    date: expense.date || '',
    // Calculate percentage of budget
    percentOfBudget: budget > 0 ? ((parseFloat(expense.amount) || 0) / budget) * 100 : 0
  })).sort((a, b) => b.amount - a.amount); // Sort by amount, highest first
  
  // Calculate total expenses
  const totalExpenses = processedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate percentage of total budget used
  const percentOfBudgetUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0;

  // Truncate long descriptions
  const truncateDescription = (description: string, maxLength: number = 20) => {
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  };

  // Format date to MM/DD/YYYY format
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Format as MM/DD/YYYY
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base text-primary">Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : processedExpenses.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            No expense data available
          </div>
        ) : (
          <>
            <div className="flex justify-between items-baseline mb-4">
              <div className="text-2xl font-bold text-primary">
                ${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className="text-sm text-muted-foreground">
                {percentOfBudgetUsed.toFixed(1)}% of budget
              </div>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {processedExpenses.map((expense) => (
                <div key={expense.id}>
                  <div className="flex items-center mb-1">
                    <div className="w-1/2 truncate text-sm" title={expense.description}>
                      {truncateDescription(expense.description)}
                    </div>
                    <div className="w-1/2 flex justify-end items-baseline gap-2">
                      <span className="text-sm font-medium text-primary">
                        ${expense.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {expense.percentOfBudget.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 w-full bg-muted rounded-sm overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary rounded-sm"
                      style={{ 
                        width: `${Math.min(expense.percentOfBudget, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDate(expense.date)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 