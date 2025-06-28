import { createClient } from '@supabase/supabase-js';
import { Expense, Budget } from '@/types/expense';

const supabaseUrl = 'https://hrsvanxxkqggmnzisioi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc3Zhbnh4a3FnZ21uemlzaW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MjA1NTksImV4cCI6MjA2NjQ5NjU1OX0.KK9fGXGpdZbTXfl54OmhqyM9rh2rbu5Dct0Bonj7bMI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations
export const expenseService = {
  // Get all expenses for a user
  async getExpenses(userId: string) {
    console.log('Fetching expenses for user:', userId);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
    console.log('Fetched expenses:', data?.length || 0);
    return data;
  },

  // Add new expense
  async addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Adding expense:', expense);
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select();
    
    if (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
    console.log('Added expense:', data[0]);
    return data[0];
  },

  // Update expense
  async updateExpense(id: string, updates: Partial<Expense>) {
    console.log('Updating expense:', id, updates);
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
    console.log('Updated expense:', data[0]);
    return data[0];
  },

  // Delete expense
  async deleteExpense(id: string) {
    console.log('Deleting expense:', id);
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
    console.log('Deleted expense:', id);
  },

  // Get expenses by date range
  async getExpensesByDateRange(userId: string, startDate: string, endDate: string) {
    console.log('Fetching expenses by date range:', userId, startDate, endDate);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching expenses by date range:', error);
      throw error;
    }
    console.log('Fetched expenses by date range:', data?.length || 0);
    return data;
  },

  // Export expenses to CSV
  async exportExpensesToCSV(userId: string, year: number, month: number) {
    console.log('Exporting expenses to CSV:', userId, year, month);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error exporting expenses:', error);
      throw error;
    }
    console.log('Exported expenses:', data?.length || 0);
    return data;
  }
};

export const budgetService = {
  // Get current month budget
  async getCurrentBudget(userId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    console.log('Fetching current budget for:', userId, year, month);
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data
    
    if (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
    
    console.log('Fetched budget:', data);
    return data;
  },

  // Set monthly budget
  async setBudget(userId: string, amount: number) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    console.log('Setting budget:', userId, year, month, amount);
    
    // First try to update existing budget
    const { data: existingBudget } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    let result;
    if (existingBudget) {
      // Update existing budget
      const { data, error } = await supabase
        .from('budgets')
        .update({ amount, updated_at: new Date().toISOString() })
        .eq('id', existingBudget.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new budget
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          year,
          month,
          amount,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    console.log('Set budget:', result);
    return result;
  },

  // Get all budgets for a user
  async getUserBudgets(userId: string) {
    console.log('Fetching user budgets:', userId);
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) {
      console.error('Error fetching user budgets:', error);
      throw error;
    }
    console.log('Fetched user budgets:', data?.length || 0);
    return data;
  }
};

// CSV Export utility
export const exportToCSV = (data: any[], filename: string) => {
  console.log('Exporting to CSV:', filename, data.length);
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('CSV export completed');
};
