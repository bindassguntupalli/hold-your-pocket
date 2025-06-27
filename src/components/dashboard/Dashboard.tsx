
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { expenseService, budgetService } from '@/lib/supabase';
import { Expense, Budget } from '@/types/expense';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertTriangle, Calendar, Plus, Target, Wallet, CreditCard } from 'lucide-react';
import { ExpenseChart } from './ExpenseChart';
import { RecentExpenses } from './RecentExpenses';
import { AddExpenseForm } from '@/components/expense/AddExpenseForm';
import { ExpenseList } from '@/components/expense/ExpenseList';
import { EditExpenseForm } from '@/components/expense/EditExpenseForm';
import { BudgetForm } from '@/components/budget/BudgetForm';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

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
      console.log('Loading dashboard data for user:', user.id);
      
      const allExpenses = await expenseService.getExpenses(user.id);
      const currentBudget = await budgetService.getCurrentBudget(user.id);
      
      console.log('Loaded expenses:', allExpenses?.length || 0);
      console.log('Loaded budget:', currentBudget);
      
      setExpenses(allExpenses || []);
      setBudget(currentBudget);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
    
    const monthlyTotal = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    console.log('Current month total:', monthlyTotal);
    return monthlyTotal;
  };

  const getTopCategory = () => {
    if (expenses.length === 0) return null;
    
    const categoryTotals: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    console.log('Category totals:', categoryTotals);
    console.log('Top category:', topCategory);
    
    return topCategory ? { name: topCategory[0], amount: topCategory[1] } : null;
  };

  const getBudgetStatus = () => {
    if (!budget) return { status: 'No Budget Set', color: 'bg-gray-100 text-gray-600', percentage: 0 };
    
    const currentMonthTotal = getCurrentMonthTotal();
    const percentage = (currentMonthTotal / budget.monthly_limit) * 100;
    
    if (percentage >= 100) {
      return { status: 'Budget Exceeded', color: 'bg-red-100 text-red-800', percentage };
    } else if (percentage >= 80) {
      return { status: 'Budget Warning', color: 'bg-yellow-100 text-yellow-800', percentage };
    } else {
      return { status: 'Within Budget', color: 'bg-green-100 text-green-800', percentage };
    }
  };

  const currentMonthTotal = getCurrentMonthTotal();
  const topCategory = getTopCategory();
  const budgetStatus = getBudgetStatus();
  const remainingBudget = budget ? budget.monthly_limit - currentMonthTotal : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ExpenseTracker
              </h1>
              <p className="text-gray-600 font-medium">
                Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}! 👋
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Add New Expense</DialogTitle>
                  </DialogHeader>
                  <AddExpenseForm 
                    onExpenseAdded={() => {
                      handleRefresh();
                      setShowAddForm(false);
                      toast.success('Expense added successfully!');
                    }}
                    onClose={() => setShowAddForm(false)}
                  />
                </DialogContent>
              </Dialog>
              <Button onClick={signOut} variant="outline" className="hover:bg-gray-50">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* This Month Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 font-medium">This Month</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(currentMonthTotal)}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">
                    {expenses.filter(e => {
                      const date = new Date(e.date);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length} transactions
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-full">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold text-white">
                    {expenses.length}
                  </p>
                  <p className="text-green-100 text-sm mt-1">
                    All time records
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-full">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Category Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 font-medium">Top Category</p>
                  <p className="text-xl font-bold text-white">
                    {topCategory ? topCategory.name : 'No data'}
                  </p>
                  {topCategory && (
                    <p className="text-purple-100 text-sm mt-1">
                      {formatCurrency(topCategory.amount)}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-white/20 rounded-full">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Status Card */}
          <Card 
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-orange-500 to-red-500 text-white"
            onClick={() => setShowBudgetForm(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-orange-100 font-medium">Budget Status</p>
                  {budget ? (
                    <div>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(budget.monthly_limit)}
                      </p>
                      <p className="text-orange-100 text-sm">
                        {formatCurrency(Math.max(0, remainingBudget))} remaining
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-white rounded-full h-2 transition-all duration-300"
                            style={{ width: `${Math.min(100, budgetStatus.percentage)}%` }}
                          />
                        </div>
                        <Badge className={`mt-2 ${budgetStatus.color} text-xs`}>
                          {budgetStatus.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-bold text-white">Click to set</p>
                      <p className="text-orange-100 text-sm">No budget defined</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white/20 rounded-full">
                  <Target className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-white shadow-sm">
            <TabsTrigger value="overview" className="font-medium">Overview</TabsTrigger>
            <TabsTrigger value="expenses" className="font-medium">All Expenses</TabsTrigger>
            <TabsTrigger value="budget" className="font-medium">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {expenses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ExpenseChart expenses={expenses} />
                <RecentExpenses expenses={expenses.slice(0, 5)} />
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses yet</h3>
                  <p className="text-gray-600 mb-6">Start tracking your expenses to see insights and analytics</p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Expense
                  </Button>
                </CardContent>
              </Card>
            )}
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

        {/* Modals */}
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
                  toast.success('Expense updated successfully!');
                }}
                onClose={() => setEditingExpense(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Monthly Budget</DialogTitle>
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
