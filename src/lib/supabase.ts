import { createClient } from '@supabase/supabase-js';
import { Expense, Budget } from '@/types/expense';

const supabaseUrl = 'https://hrsvanxxkqggmnzisioi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc3Zhbnh4a3FnZ21uemlzaW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MjA1NTksImV4cCI6MjA2NjQ5NjU1OX0.KK9fGXGpdZbTXfl54OmhqyM9rh2rbu5Dct0Bonj7bMI';

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
  },

  // Export expenses to CSV
  async exportExpensesToCSV(userId: string, month: string) {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    
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
  // Get current month budget - Supabase only
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

  // Set monthly budget - Supabase only
  async setBudget(userId: string, amount: number) {
    const now = new Date();
    const month = now.toISOString().substring(0, 7);
    const year = now.getFullYear();
    
    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        month,
        amount,
        year,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all budgets for a user
  async getUserBudgets(userId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
