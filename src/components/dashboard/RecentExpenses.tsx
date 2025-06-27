
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Expense } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { Receipt, Clock } from 'lucide-react';

interface RecentExpensesProps {
  expenses: Expense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-orange-100 text-orange-800 border-orange-200',
      'Transportation': 'bg-blue-100 text-blue-800 border-blue-200',
      'Entertainment': 'bg-purple-100 text-purple-800 border-purple-200',
      'Shopping': 'bg-pink-100 text-pink-800 border-pink-200',
      'Health': 'bg-green-100 text-green-800 border-green-200',
      'Utilities': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Travel': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Education': 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Food': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Health': '💊',
      'Utilities': '⚡',
      'Travel': '✈️',
      'Education': '📚',
    };
    return icons[category] || '💰';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="h-5 w-5 text-blue-600" />
          Recent Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No recent expenses</p>
            <p className="text-gray-400 text-sm">Your latest transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getCategoryColor(expense.category)} font-medium px-3 py-1`}>
                      {expense.category}
                    </Badge>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{expense.description}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(expense.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
