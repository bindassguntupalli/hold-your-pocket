
import { useState } from 'react';
import { expenseService } from '@/lib/supabase';
import { Expense } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Edit, DollarSign } from 'lucide-react';

interface EditExpenseFormProps {
  expense: Expense;
  onExpenseUpdated?: () => void;
  onClose?: () => void;
}

const CATEGORIES = [
  { value: 'Food', label: 'Food & Dining' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Health', label: 'Health & Medical' },
  { value: 'Utilities', label: 'Utilities & Bills' },
  { value: 'Other', label: 'Other' }
];

export function EditExpenseForm({ expense, onExpenseUpdated, onClose }: EditExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: expense.category,
    amount: expense.amount.toString(),
    date: expense.date,
    description: expense.description
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await expenseService.updateExpense(expense.id, {
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description
      });

      toast.success('Expense updated successfully!');
      
      if (onExpenseUpdated) onExpenseUpdated();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Edit Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount (INR) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">₹</span>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="pl-8"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="What did you spend on?"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Updating...' : 'Update Expense'}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
