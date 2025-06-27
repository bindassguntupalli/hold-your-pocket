
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { expenseService } from '@/lib/supabase';
import { Expense } from '@/types/expense';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Download, Receipt } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface MonthlyExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonthlyExpensesModal({ open, onOpenChange }: MonthlyExpensesModalProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (open && user) {
      loadMonthlyExpenses();
    }
  }, [open, user]);

  const loadMonthlyExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startDate = `${currentMonth}-01`;
      const endDate = `${currentMonth}-31`;
      
      const data = await expenseService.getExpensesByDateRange(user.id, startDate, endDate);
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading monthly expenses:', error);
      toast.error('Failed to load monthly expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    
    try {
      const data = await expenseService.exportExpensesToCSV(user.id, currentMonth);
      
      if (!data || data.length === 0) {
        toast.error('No expenses found for this month');
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Category', 'Description', 'Amount'];
      const csvContent = [
        headers.join(','),
        ...data.map(expense => [
          expense.date,
          expense.category,
          `"${expense.description}"`,
          expense.amount
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expenses-${monthName.replace(' ', '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Expenses exported successfully!');
    } catch (error) {
      console.error('Error exporting expenses:', error);
      toast.error('Failed to export expenses');
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-blue-600" />
            {monthName} Expenses
          </DialogTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
            </p>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No expenses this month</p>
              <p className="text-gray-400 text-sm">Start tracking your expenses to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500 min-w-[80px]">
                      {new Date(expense.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                    <Badge className={`${getCategoryColor(expense.category)} font-medium`}>
                      {expense.category}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
