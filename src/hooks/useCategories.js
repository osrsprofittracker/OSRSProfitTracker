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

      // Store full objects so is_investment is accessible
      const categoryObjects = (data || []).map(cat => ({
        id: cat.id,
        name: String(cat.name),
        isInvestment: cat.is_investment || false,
        position: cat.position,
        created_at: cat.created_at
      }));
      setCategories(categoryObjects);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    setLoading(false);
  };

  const reorderCategories = async (categoryName, newPosition, isInvestment = false) => {
    try {
      const { data: allCategories, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;

      // Only reorder within the same mode
      const modeCategories = allCategories.filter(cat => cat.is_investment === isInvestment);
      const otherCategories = allCategories.filter(cat => cat.is_investment !== isInvestment);

      const movingCategoryIndex = modeCategories.findIndex(cat =>
        String(cat.name) === String(categoryName)
      );
      if (movingCategoryIndex === -1) {
        console.error('Category not found:', categoryName);
        return { success: false };
      }

      const reordered = [...modeCategories];
      const [movingCategory] = reordered.splice(movingCategoryIndex, 1);
      reordered.splice(newPosition, 0, movingCategory);

      // Reassign positions only within this mode, starting from 0
      const updates = reordered.map((cat, index) => ({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        position: index,
        is_investment: cat.is_investment,
        created_at: cat.created_at
      }));

      const { error } = await supabase
        .from('categories')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  };

  const addCategory = async (name, isInvestment = false) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: String(name),
          user_id: userId,
          is_investment: isInvestment,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  const updateCategory = async (oldName, newName, isInvestment = false) => {
    try {
      const { error: categoryError } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('name', oldName)
        .eq('user_id', userId)
        .eq('is_investment', isInvestment);

      if (categoryError) throw categoryError;

      // Update all stocks with old category
      const { error: stocksError } = await supabase
        .from('stocks')
        .update({ category: newName })
        .eq('category', oldName)
        .eq('user_id', userId)
        .eq('is_investment', isInvestment);

      if (stocksError) throw stocksError;

      // Don't update local state - let the caller refetch
      return { success: true };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (name, isInvestment = false) => {
    if (name === 'Uncategorized') {
      throw new Error('Cannot delete Uncategorized category');
    }

    try {
      const { error: stocksError } = await supabase
        .from('stocks')
        .update({ category: 'Uncategorized' })
        .eq('category', name)
        .eq('user_id', userId)
        .eq('is_investment', isInvestment);

      if (stocksError) {
        console.error('Error moving stocks:', stocksError);
        throw stocksError;
      }

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('name', name)
        .eq('user_id', userId)
        .eq('is_investment', isInvestment);

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