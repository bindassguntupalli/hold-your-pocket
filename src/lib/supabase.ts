
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrsvanxxkqggmnzisioi.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // You'll need to provide this

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations
export const expenseService = {
  // Get all expenses for a user
  async getExpenses(userId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Add new expense
  async addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Update expense
  async updateExpense(id: string, updates: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Delete expense
  async deleteExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get expenses by date range
  async getExpensesByDateRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

export const budgetService = {
  // Get current month budget
  async getCurrentBudget(userId: string) {
    const now = new Date();
    const month = now.toISOString().substring(0, 7); // YYYY-MM format
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Set monthly budget
  async setBudget(userId: string, monthlyLimit: number) {
    const now = new Date();
    const month = now.toISOString().substring(0, 7);
    const year = now.getFullYear();
    
    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        monthly_limit: monthlyLimit,
        month,
        year,
        current_spent: 0
      })
      .select();
    
    if (error) throw error;
    return data[0];
  }
};
