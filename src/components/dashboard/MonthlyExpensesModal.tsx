import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { expenseService } from '@/lib/supabase';
import { Expense } from '@/types/expense';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Receipt, Download, TrendingUp } from 'lucide-react';
import { exportToCSV } from '@/lib/supabase';

interface MonthlyExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonthlyExpensesModal({ open, onOpenChange }: MonthlyExpensesModalProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadMonthlyExpenses();
    }
  }, [open, user]);

  const loadMonthlyExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      // Fix date range calculation
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of the month
      
      console.log('Loading monthly expenses:', startDate, endDate);
      
      const data = await expenseService.getExpensesByDateRange(user.id, startDate, endDate);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading monthly expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (expenses.length === 0) return;
    
    const now = new Date();
    const monthName = now.toLocaleDateString('en-IN', { month: 'long' });
    const year = now.getFullYear();
    
    const csvData = expenses.map(expense => ({
      Date: new Date(expense.date).toLocaleDateString('en-IN'),
      Category: expense.category,
      Description: expense.description,
      Amount: expense.amount
    }));
    
    exportToCSV(csvData, `expenses-${monthName}-${year}.csv`);
  };

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

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-blue-600" />
            {currentMonth} Expenses
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Total</h3>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
                    <p className="text-sm text-gray-600">{expenses.length} transactions</p>
                  </div>
                </div>
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <div className="overflow-y-auto max-h-96 space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading expenses...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses this month</h3>
                <p className="text-gray-600">Start adding expenses to see them here</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge className={`${getCategoryColor(expense.category)} font-medium px-3 py-1`}>
                          {expense.category}
                        </Badge>
                        <div>
                          <p className="font-semibold text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(expense.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
