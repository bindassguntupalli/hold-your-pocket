
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Expense } from '@/types/expense';

interface RecentExpensesProps {
  expenses: Expense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Health': 'bg-green-100 text-green-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No expenses yet</p>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getCategoryColor(expense.category)}>
                      {expense.category}
                    </Badge>
                  </div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    -${expense.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
