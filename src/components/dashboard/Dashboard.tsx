
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { expenseService, budgetService } from '@/lib/supabase';
import { Expense, Budget } from '@/types/expense';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { ExpenseChart } from './ExpenseChart';
import { RecentExpenses } from './RecentExpenses';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get current month expenses
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthlyExpenses = await expenseService.getExpensesByDateRange(
        user.id,
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0]
      );
      
      const allExpenses = await expenseService.getExpenses(user.id);
      const currentBudget = await budgetService.getCurrentBudget(user.id);
      
      setExpenses(allExpenses || []);
      setBudget(currentBudget);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonthTotal = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getTopCategory = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topCategory ? { name: topCategory[0], amount: topCategory[1] } : null;
  };

  const currentMonthTotal = getCurrentMonthTotal();
  const topCategory = getTopCategory();
  const budgetWarning = budget && currentMonthTotal > budget.monthly_limit * 0.8;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
            </div>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${currentMonthTotal.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {expenses.length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Category</p>
                  <p className="text-lg font-bold text-gray-900">
                    {topCategory ? topCategory.name : 'N/A'}
                  </p>
                  {topCategory && (
                    <p className="text-sm text-gray-500">${topCategory.amount.toFixed(2)}</p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget Status</p>
                  {budget ? (
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        ${budget.monthly_limit.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${(budget.monthly_limit - currentMonthTotal).toFixed(2)} remaining
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-gray-500">Not set</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${budgetWarning ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <AlertTriangle className={`h-6 w-6 ${budgetWarning ? 'text-red-600' : 'text-yellow-600'}`} />
                </div>
              </div>
              {budgetWarning && (
                <Badge variant="destructive" className="mt-2">
                  Budget Warning!
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts and Recent Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExpenseChart expenses={expenses} />
          <RecentExpenses expenses={expenses.slice(0, 5)} />
        </div>
      </main>
    </div>
  );
}
