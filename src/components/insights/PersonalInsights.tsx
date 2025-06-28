import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { expenseService } from '@/lib/supabase';
import { Expense } from '@/types/expense';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function PersonalInsights() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;
    try {
      const data = await expenseService.getExpenses(user.id);
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate insights
  const getSpendingTrend = () => {
    const last30Days = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return expenseDate >= thirtyDaysAgo;
    });

    const previous30Days = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return expenseDate >= sixtyDaysAgo && expenseDate < thirtyDaysAgo;
    });

    const currentTotal = last30Days.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previous30Days.reduce((sum, e) => sum + e.amount, 0);
    const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return { currentTotal, previousTotal, change };
  };

  const getDailySpending = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayExpenses = expenses.filter(e => e.date === dateStr);
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        amount: total,
        fullDate: dateStr
      });
    }
    return last7Days;
  };

  const getCategoryInsights = () => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const sorted = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    return sorted.map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    }));
  };

  const getSpendingGoals = () => {
    const currentMonth = new Date().getMonth();
    const monthlyExpenses = expenses.filter(e => new Date(e.date).getMonth() === currentMonth);
    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Suggest goals based on spending patterns
    const avgDailySpend = monthlyTotal / new Date().getDate();
    const projectedMonthly = avgDailySpend * 30;
    
    return {
      currentMonthSpend: monthlyTotal,
      avgDailySpend,
      projectedMonthly,
      daysRemaining: 30 - new Date().getDate()
    };
  };

  const spendingTrend = getSpendingTrend();
  const dailySpending = getDailySpending();
  const categoryInsights = getCategoryInsights();
  const spendingGoals = getSpendingGoals();

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Personal Insights
        </h1>
        <p className="text-gray-600">Understand your spending patterns and make smarter financial decisions</p>
      </div>

      {/* Spending Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">30-Day Trend</p>
                <p className="text-2xl font-bold">{formatCurrency(spendingTrend.currentTotal)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {spendingTrend.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-200" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-200" />
                  )}
                  <span className="text-sm">
                    {Math.abs(spendingTrend.change).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Daily Average</p>
                <p className="text-2xl font-bold">{formatCurrency(spendingGoals.avgDailySpend)}</p>
                <p className="text-green-100 text-sm">This month</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Projected Monthly</p>
                <p className="text-2xl font-bold">{formatCurrency(spendingGoals.projectedMonthly)}</p>
                <p className="text-purple-100 text-sm">{spendingGoals.daysRemaining} days left</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Categories</p>
                <p className="text-2xl font-bold">{categoryInsights.length}</p>
                <p className="text-orange-100 text-sm">Active this month</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Spending Chart - Fixed alignment */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              7-Day Spending Pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="w-full h-[280px]">
              <ChartContainer config={{amount: {label: "Amount"}}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySpending} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} />
                    <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} />
                    <ChartTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-blue-600 font-bold">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3B82F6" 
                      fill="url(#colorGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryInsights.map((item, index) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(item.amount)}</p>
                      <p className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Recommendations */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">💡 Spending Pattern</h4>
              <p className="text-sm text-amber-700">
                {spendingTrend.change > 10 
                  ? "Your spending increased by " + spendingTrend.change.toFixed(1) + "% this month. Consider reviewing your budget."
                  : spendingTrend.change < -10
                  ? "Great job! You've reduced spending by " + Math.abs(spendingTrend.change).toFixed(1) + "% this month."
                  : "Your spending is relatively stable this month."}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">🎯 Budget Goal</h4>
              <p className="text-sm text-amber-700">
                {categoryInsights.length > 0 
                  ? `Your top spending category is ${categoryInsights[0].category}. Consider setting a specific budget for it.`
                  : "Start by setting category-wise budgets to better track your expenses."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
