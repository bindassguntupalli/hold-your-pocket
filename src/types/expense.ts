
export interface Expense {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Budget {
  id: string;
  user_id: string;
  monthly_limit: number;
  current_spent: number;
  month: string;
  year: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}
