import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCategories(userId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchCategories();
  }, [userId]);

  const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching categories:', error);
    setCategories([]);  // Set empty array on error
  } else {
    setCategories((data || []).map(c => c.name));
  }
  setLoading(false);
};

  const addCategory = async (name) => {
    const { error } = await supabase
      .from('categories')
      .insert([{ user_id: userId, name }]);
    
    if (error) {
      console.error('Error adding category:', error);
      return false;
    } else {
      setCategories([...categories, name]);
      return true;
    }
  };

  const deleteCategory = async (name) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId)
      .eq('name', name);
    
    if (error) {
      console.error('Error deleting category:', error);
      return false;
    } else {
      setCategories(categories.filter(c => c !== name));
      return true;
    }
  };

  return { categories, loading, addCategory, deleteCategory, refetch: fetchCategories };
}