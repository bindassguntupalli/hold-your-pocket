
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { budgetService } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Target, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetFormProps {
  currentBudget?: number;
  onBudgetSet?: () => void;
}

export function BudgetForm({ currentBudget, onBudgetSet }: BudgetFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(currentBudget?.toString() || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to set budget');
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (!budgetAmount || amount <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    if (amount < 100) {
      toast.error('Budget amount should be at least ₹100');
      return;
    }

    setLoading(true);
    try {
      console.log('Setting budget for user:', user.id, 'Amount:', amount);
      const result = await budgetService.setBudget(user.id, amount);
      console.log('Budget set successfully:', result);
      
      toast.success(`Monthly budget set to ${formatCurrency(amount)}! 🎯`);
      
      if (onBudgetSet) onBudgetSet();
    } catch (error) {
      console.error('Error setting budget:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to set budget: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="h-6 w-6 text-blue-600" />
          {currentBudget ? 'Update Monthly Budget' : 'Set Monthly Budget'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="budget" className="text-base font-medium text-gray-900">
              Monthly Budget Limit
            </Label>
            <div className="relative mt-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="budget"
                type="number"
                step="1"
                min="100"
                placeholder="10000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="pl-10 text-lg h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                💡 Set a monthly spending limit to help track your expenses in Indian Rupees
              </p>
              <p className="text-xs text-blue-600 mt-1">
                You'll get alerts when you're close to your budget limit
              </p>
            </div>
          </div>

          {currentBudget && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Current budget: <span className="font-semibold text-gray-900">{formatCurrency(currentBudget)}</span>
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Setting Budget...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {currentBudget ? 'Update Budget' : 'Set Budget'}
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
