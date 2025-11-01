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
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) throw error;
    
    // Extract just the names from the category objects and ensure they're strings
    const categoryNames = (data || []).map(cat => String(cat.name));
    setCategories(categoryNames);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

const reorderCategories = async (categoryName, newPosition) => {
  try {
    // Get all categories for this user ordered by position
    const { data: allCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (fetchError) throw fetchError;

    // Find the category being moved
    const movingCategoryIndex = allCategories.findIndex(cat => String(cat.name) === String(categoryName));
    if (movingCategoryIndex === -1) {
      console.error('Category not found:', categoryName, 'Available:', allCategories.map(c => c.name));
      return { success: false };
    }

    // Reorder the array
    const reordered = [...allCategories];
    const [movingCategory] = reordered.splice(movingCategoryIndex, 1);
    reordered.splice(newPosition, 0, movingCategory);

    // Update all positions in a transaction-like manner
    const updates = reordered.map((cat, index) => ({
      id: cat.id,
      position: index
    }));

    // Update each category's position
    for (const update of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ position: update.position })
        .eq('id', update.id)
        .eq('user_id', userId);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error reordering categories:', error);
    throw error;
  }
};

  const addCategory = async (name) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        name: String(name), // Force conversion to string
        user_id: userId,
        created_at: new Date().toISOString() 
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('New category added to DB:', data);

    // Don't update local state - let the caller refetch
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
    // Update category name
    const { error: categoryError } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('name', oldName)
      .eq('user_id', userId);

    if (categoryError) throw categoryError;

    // Update all stocks with old category
    const { error: stocksError } = await supabase
      .from('stocks')
      .update({ category: newName })
      .eq('category', oldName)
      .eq('user_id', userId);

    if (stocksError) throw stocksError;

    // Don't update local state - let the caller refetch
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
      .eq('user_id', userId);

    if (stocksError) {
      console.error('Error moving stocks:', stocksError);
      throw stocksError;
    }

    // Then delete the category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('name', name)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      throw deleteError;
    }

    // Don't update local state - let the caller refetch
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
    deleteCategory,
    reorderCategories
  };
}