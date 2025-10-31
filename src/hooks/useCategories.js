import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCategories(userId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
  try {
    if (!userId) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    // Extract just the names from the category objects
    const categoryNames = (data || []).map(cat => cat.name);
    setCategories(categoryNames);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

  const addCategory = async (name) => {
  try {
    // Add to database first
    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        name, 
        user_id: userId,
        created_at: new Date().toISOString() 
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('New category added to DB:', data); // Debug log

    // Update local state only after successful DB insert
    setCategories(prev => [...prev, name]);
    return data;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  const updateCategory = async (oldName, newName) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('name', oldName)
        .eq('user_id', userId);

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat === oldName ? newName : cat
      ));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (name) => {
  if (name === 'Uncategorized') {
    throw new Error('Cannot delete Uncategorized category');
  }

  try {

    // First move all stocks to Uncategorized
    const { error: stocksError } = await supabase
      .from('stocks')
      .update({ category: 'Uncategorized' })
      .eq('category', name)
      .eq('user_id', userId)
      .select();

    if (stocksError) {
      console.error('Error moving stocks:', stocksError);
      throw stocksError;
    }

    // Then delete the category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .match({ name: name, user_id: userId });

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      throw deleteError;
    }

    // Update local state only after successful deletion
    setCategories(prev => prev.filter(cat => cat !== name));
    return { success: true };
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    throw error;
  }
};

  return {
    categories,
    setCategories,
    loading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory
  };
}