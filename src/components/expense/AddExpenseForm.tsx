
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { expenseService } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Plus } from 'lucide-react';

interface AddExpenseFormProps {
  onExpenseAdded?: () => void;
  onClose?: () => void;
}

const CATEGORIES = [
  { value: 'Food', label: 'Food & Dining', color: 'bg-orange-100 text-orange-800' },
  { value: 'Transportation', label: 'Transportation', color: 'bg-blue-100 text-blue-800' },
  { value: 'Entertainment', label: 'Entertainment', color: 'bg-purple-100 text-purple-800' },
  { value: 'Shopping', label: 'Shopping', color: 'bg-pink-100 text-pink-800' },
  { value: 'Health', label: 'Health & Medical', color: 'bg-green-100 text-green-800' },
  { value: 'Utilities', label: 'Utilities & Bills', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Travel', label: 'Travel', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'Education', label: 'Education', color: 'bg-teal-100 text-teal-800' },
  { value: 'Other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
];

export function AddExpenseForm({ onExpenseAdded, onClose }: AddExpenseFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to add expenses');
      return;
    }

    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      console.log('Adding expense:', formData);
      await expenseService.addExpense({
        user_id: user.id,
        category: formData.category,
        amount: amount,
        date: formData.date,
        description: formData.description
      });

      console.log('Expense added successfully');
      toast.success('Expense added successfully! 🎉');
      setFormData({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      
      if (onExpenseAdded) onExpenseAdded();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Expense
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
              {loading ? 'Adding...' : 'Add Expense'}
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
