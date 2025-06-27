
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { budgetService } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Target } from 'lucide-react';
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

    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setLoading(true);
    try {
      console.log('Setting budget for user:', user.id, 'Amount:', budgetAmount);
      await budgetService.setBudget(user.id, parseFloat(budgetAmount));
      toast.success(`Monthly budget set to ${formatCurrency(parseFloat(budgetAmount))}!`);
      
      if (onBudgetSet) onBudgetSet();
    } catch (error) {
      console.error('Error setting budget:', error);
      toast.error(`Failed to set budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {currentBudget ? 'Update Monthly Budget' : 'Set Monthly Budget'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="budget">Monthly Budget Limit (INR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">₹</span>
              <Input
                id="budget"
                type="number"
                step="1"
                min="0"
                placeholder="10000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="pl-8"
                required
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Set a monthly spending limit to help track your expenses in Indian Rupees
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Setting Budget...' : (currentBudget ? 'Update Budget' : 'Set Budget')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
