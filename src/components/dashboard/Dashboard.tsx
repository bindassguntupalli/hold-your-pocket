
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { expenseService, budgetService } from '@/lib/supabase';
import { Expense, Budget } from '@/types/expense';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertTriangle, Calendar, Plus, Target } from 'lucide-react';
import { ExpenseChart } from './ExpenseChart';
import { RecentExpenses } from './RecentExpenses';
import { AddExpenseForm } from '@/components/expense/AddExpenseForm';
import { ExpenseList } from '@/components/expense/ExpenseList';
import { EditExpenseForm } from '@/components/expense/EditExpenseForm';
import { BudgetForm } from '@/components/budget/BudgetForm';
import { formatCurrency } from '@/lib/utils';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, refreshTrigger]);

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

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
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

  const getBudgetStatus = () => {
    if (!budget) return { status: 'No Budget Set', color: 'bg-gray-100 text-gray-600' };
    
    const currentMonthTotal = getCurrentMonthTotal();
    const percentage = (currentMonthTotal / budget.monthly_limit) * 100;
    
    if (percentage >= 100) {
      return { status: 'Budget Exceeded', color: 'bg-red-100 text-red-800' };
    } else if (percentage >= 80) {
      return { status: 'Budget Warning', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'Within Budget', color: 'bg-green-100 text-green-800' };
    }
  };

  const currentMonthTotal = getCurrentMonthTotal();
  const topCategory = getTopCategory();
  const budgetWarning = budget && currentMonthTotal > budget.monthly_limit * 0.8;
  const budgetStatus = getBudgetStatus();

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
              <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
              <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                  </DialogHeader>
                  <AddExpenseForm 
                    onExpenseAdded={() => {
                      handleRefresh();
                      setShowAddForm(false);
                    }}
                    onClose={() => setShowAddForm(false)}
                  />
                </DialogContent>
              </Dialog>
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </div>
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
                    {formatCurrency(currentMonthTotal)}
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
                    <p className="text-sm text-gray-500">{formatCurrency(topCategory.amount)}</p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer" onClick={() => setShowBudgetForm(true)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget Status</p>
                  {budget ? (
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(budget.monthly_limit)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(budget.monthly_limit - currentMonthTotal)} remaining
                      </p>
                      <Badge className={`mt-1 ${budgetStatus.color}`}>
                        {budgetStatus.status}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-gray-500">Click to set</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${budgetWarning ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <Target className={`h-6 w-6 ${budgetWarning ? 'text-red-600' : 'text-yellow-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">All Expenses</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ExpenseChart expenses={expenses} />
              <RecentExpenses expenses={expenses.slice(0, 5)} />
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseList 
              onEditExpense={setEditingExpense}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetForm 
              currentBudget={budget?.monthly_limit}
              onBudgetSet={handleRefresh}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Expense Dialog */}
        <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <EditExpenseForm 
                expense={editingExpense}
                onExpenseUpdated={() => {
                  handleRefresh();
                  setEditingExpense(null);
                }}
                onClose={() => setEditingExpense(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Budget Dialog */}
        <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Budget</DialogTitle>
            </DialogHeader>
            <BudgetForm 
              currentBudget={budget?.monthly_limit}
              onBudgetSet={() => {
                handleRefresh();
                setShowBudgetForm(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
