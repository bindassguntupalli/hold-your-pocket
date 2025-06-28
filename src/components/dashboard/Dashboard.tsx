
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { expenseService, budgetService, exportToCSV } from '@/lib/supabase';
import { Expense, Budget } from '@/types/expense';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertTriangle, Calendar, Plus, Target, Wallet, CreditCard, Download, Sparkles, Pencil, Award } from 'lucide-react';
import { ExpenseChart } from './ExpenseChart';
import { RecentExpenses } from './RecentExpenses';
import { AddExpenseForm } from '@/components/expense/AddExpenseForm';
import { ExpenseList } from '@/components/expense/ExpenseList';
import { EditExpenseForm } from '@/components/expense/EditExpenseForm';
import { BudgetForm } from '@/components/budget/BudgetForm';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { MonthlyExpensesModal } from './MonthlyExpensesModal';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showMonthlyExpenses, setShowMonthlyExpenses] = useState(false);

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
      
      const [allExpenses, currentBudget] = await Promise.all([
        expenseService.getExpenses(user.id),
        budgetService.getCurrentBudget(user.id)
      ]);
      
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
    
    return monthlyTotal;
  };

  const getTopCategory = () => {
    if (expenses.length === 0) return null;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
    
    const categoryTotals: { [key: string]: number } = {};
    
    monthlyExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topCategory ? { name: topCategory[0], amount: topCategory[1] } : null;
  };

  const getBudgetStatus = () => {
    if (!budget) return { status: 'No Budget Set', color: 'bg-gray-100 text-gray-600', percentage: 0 };
    
    const currentMonthTotal = getCurrentMonthTotal();
    const percentage = (currentMonthTotal / budget.amount) * 100;
    
    if (percentage >= 100) {
      return { status: 'Budget Exceeded', color: 'bg-red-100 text-red-800', percentage };
    } else if (percentage >= 80) {
      return { status: 'Budget Warning', color: 'bg-yellow-100 text-yellow-800', percentage };
    } else {
      return { status: 'Within Budget', color: 'bg-green-100 text-green-800', percentage };
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const monthName = now.toLocaleDateString('en-IN', { month: 'long' });
      const year = now.getFullYear();
      
      const monthlyExpenses = await expenseService.exportExpensesToCSV(user.id, now.toISOString().substring(0, 7));
      
      if (monthlyExpenses && monthlyExpenses.length > 0) {
        const csvData = monthlyExpenses.map(expense => ({
          Date: new Date(expense.date).toLocaleDateString('en-IN'),
          Category: expense.category,
          Description: expense.description,
          Amount: expense.amount
        }));
        
        exportToCSV(csvData, `expenses-${monthName}-${year}.csv`);
        toast.success(`Expenses exported successfully! 📊`);
      } else {
        toast.error('No expenses found for this month');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export expenses');
    }
  };

  const currentMonthTotal = getCurrentMonthTotal();
  const topCategory = getTopCategory();
  const budgetStatus = getBudgetStatus();
  const remainingBudget = budget ? Math.max(0, budget.amount - currentMonthTotal) : 0;

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
      {/* Enhanced Header with Background Pattern */}
      <header className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Financial Dashboard
                </h1>
                <p className="text-gray-600 font-medium">
                  Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}! 👋
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleExportCSV}
                variant="outline" 
                className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add New Expense
                    </DialogTitle>
                  </DialogHeader>
                  <AddExpenseForm 
                    onExpenseAdded={() => {
                      handleRefresh();
                      setShowAddForm(false);
                      toast.success('Expense added successfully! 🎉');
                    }}
                    onClose={() => setShowAddForm(false)}
                  />
                </DialogContent>
              </Dialog>
              <Button onClick={signOut} variant="outline" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* This Month Card - Clickable with hover effects */}
          <Card 
            className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white cursor-pointer transform hover:scale-105 hover:-translate-y-1"
            onClick={() => setShowMonthlyExpenses(true)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    This Month
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {formatCurrency(currentMonthTotal)}
                  </p>
                  <p className="text-blue-100 text-sm mt-2 flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {expenses.filter(e => {
                        const date = new Date(e.date);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length} transactions
                    </span>
                    • Click to view details
                  </p>
                  {budget && remainingBudget > 0 && (
                    <p className="text-blue-100 text-xs mt-1">
                      {formatCurrency(remainingBudget)} remaining
                    </p>
                  )}
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 text-white transform hover:scale-105 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Expenses
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {expenses.length}
                  </p>
                  <p className="text-green-100 text-sm mt-2">
                    All time records
                  </p>
                  <p className="text-green-100 text-xs mt-1">
                    Total: {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Category Card */}
          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 text-white transform hover:scale-105 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Top Category
                  </p>
                  <p className="text-xl font-bold text-white mt-1">
                    {topCategory ? topCategory.name : 'No data'}
                  </p>
                  {topCategory && (
                    <>
                      <p className="text-purple-100 text-sm mt-1">
                        {formatCurrency(topCategory.amount)} this month
                      </p>
                      <div className="mt-2">
                        <Badge className="bg-white/20 text-white text-xs px-2 py-1">
                          Most Spent
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Calendar className="h-8 w-8text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Status Card */}
          <Card 
            className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white transform hover:scale-105 hover:-translate-y-1"
            onClick={() => setShowBudgetForm(true)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-orange-100 font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Budget Status
                  </p>
                  {budget ? (
                    <div className="mt-1">
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(budget.amount)}
                      </p>
                      <p className="text-orange-100 text-sm">
                        {formatCurrency(Math.max(0, remainingBudget))} remaining
                      </p>
                      <div className="mt-3">
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-white rounded-full h-2 transition-all duration-500"
                            style={{ width: `${Math.min(100, budgetStatus.percentage)}%` }}
                          />
                        </div>
                        <Badge className={`mt-2 ${budgetStatus.color} text-xs`}>
                          {budgetStatus.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-xl font-bold text-white">Click to set</p>
                      <p className="text-orange-100 text-sm">No budget defined</p>
                      <Badge className="mt-2 bg-white/20 text-white text-xs">
                        Set Budget
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Target className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white shadow-lg border border-gray-200/50 rounded-xl">
            <TabsTrigger value="overview" className="font-semibold text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="expenses" className="font-semibold text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              All Expenses
            </TabsTrigger>
            <TabsTrigger value="budget" className="font-semibold text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Budget
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {expenses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ExpenseChart expenses={expenses} />
                <RecentExpenses expenses={expenses.slice(0, 5)} />
              </div>
            ) : (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-white">
                <CardContent className="p-12 text-center">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No expenses yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Start tracking your expenses to see detailed insights, analytics, and spending patterns
                  </p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
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
            <div className="max-w-2xl mx-auto">
              <BudgetForm 
                currentBudget={budget?.amount}
                onBudgetSet={handleRefresh}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Edit Expense
              </DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <EditExpenseForm 
                expense={editingExpense}
                onExpenseUpdated={() => {
                  handleRefresh();
                  setEditingExpense(null);
                  toast.success('Expense updated successfully! ✅');
                }}
                onClose={() => setEditingExpense(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Manage Monthly Budget
              </DialogTitle>
            </DialogHeader>
            <BudgetForm 
              currentBudget={budget?.amount}
              onBudgetSet={() => {
                handleRefresh();
                setShowBudgetForm(false);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Monthly Expenses Modal */}
        <MonthlyExpensesModal 
          open={showMonthlyExpenses}
          onOpenChange={setShowMonthlyExpenses}
        />
      </main>
    </div>
  );
}
