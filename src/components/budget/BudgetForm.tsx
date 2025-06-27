
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { budgetService } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Target, DollarSign } from 'lucide-react';

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
    if (!user) return;

    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setLoading(true);
    try {
      await budgetService.setBudget(user.id, parseFloat(budgetAmount));
      toast.success('Monthly budget set successfully!');
      
      if (onBudgetSet) onBudgetSet();
    } catch (error) {
      console.error('Error setting budget:', error);
      toast.error('Failed to set budget');
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
            <Label htmlFor="budget">Monthly Budget Limit</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="1000.00"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Set a monthly spending limit to help track your expenses
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
