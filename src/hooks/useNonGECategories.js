import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function formatCategory(row) {
  return {
    id: row.id,
    name: String(row.name),
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useNonGECategories(userId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const findCategory = useCallback((categoryIdOrName) => {
    return categories.find(category =>
      category.id === categoryIdOrName || category.name === categoryIdOrName
    );
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('non_ge_categories')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;

      const formattedCategories = (data || []).map(formatCategory);
      setCategories(formattedCategories);
      return formattedCategories;
    } catch (error) {
      console.error('Error fetching Non-GE categories:', error);
      setCategories([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (name) => {
    try {
      const position = categories.length;
      const { data, error } = await supabase
        .from('non_ge_categories')
        .insert([{
          user_id: userId,
          name: String(name),
          position,
        }])
        .select()
        .single();

      if (error) throw error;

      return formatCategory(data);
    } catch (error) {
      console.error('Error adding Non-GE category:', error);
      throw error;
    }
  }, [userId, categories.length]);

  const updateCategory = useCallback(async (categoryIdOrName, updates) => {
    const category = findCategory(categoryIdOrName);
    const categoryId = category?.id || categoryIdOrName;
    const dbUpdates = {};

    if (typeof updates === 'string') {
      dbUpdates.name = updates;
    } else {
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.position !== undefined) dbUpdates.position = updates.position;
    }

    try {
      const { error } = await supabase
        .from('non_ge_categories')
        .update(dbUpdates)
        .eq('id', categoryId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating Non-GE category:', error);
      throw error;
    }
  }, [userId, findCategory]);

  const deleteCategory = useCallback(async (categoryIdOrName) => {
    const category = findCategory(categoryIdOrName);
    const categoryId = category?.id || categoryIdOrName;

    if (category?.name === 'Uncategorized') {
      throw new Error('Cannot delete Uncategorized category');
    }

    try {
      const uncategorized = categories.find(category => category.name === 'Uncategorized');
      const nextCategoryId = uncategorized?.id || null;

      const { error: stocksError } = await supabase
        .from('non_ge_stocks')
        .update({ category_id: nextCategoryId })
        .eq('category_id', categoryId)
        .eq('user_id', userId);

      if (stocksError) throw stocksError;

      const { error } = await supabase
        .from('non_ge_categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting Non-GE category:', error);
      throw error;
    }
  }, [userId, categories, findCategory]);

  const reorderCategories = useCallback(async (categoryId, newPosition) => {
    try {
      const currentIndex = categories.findIndex(category => category.id === categoryId);
      if (currentIndex === -1) return { success: false };

      const reordered = [...categories];
      const [movingCategory] = reordered.splice(currentIndex, 1);
      reordered.splice(newPosition, 0, movingCategory);

      const updates = reordered.map((category, index) => ({
        id: category.id,
        user_id: userId,
        name: category.name,
        position: index,
      }));

      const { error } = await supabase
        .from('non_ge_categories')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error reordering Non-GE categories:', error);
      throw error;
    }
  }, [userId, categories]);

  const ensureDefaultCategories = useCallback(async (defaultNames = []) => {
    if (!userId || defaultNames.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('non_ge_categories')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const existingNames = new Set((data || []).map(category => String(category.name).toLowerCase()));
      const missingNames = defaultNames.filter(name => !existingNames.has(String(name).toLowerCase()));

      if (missingNames.length > 0) {
        const startingPosition = data?.length || 0;
        const inserts = missingNames.map((name, index) => ({
          user_id: userId,
          name: String(name),
          position: startingPosition + index,
        }));

        const { error: insertError } = await supabase
          .from('non_ge_categories')
          .insert(inserts);

        if (insertError) throw insertError;
      }

      return fetchCategories();
    } catch (error) {
      console.error('Error ensuring default Non-GE categories:', error);
      throw error;
    }
  }, [userId, fetchCategories]);

  return {
    categories,
    loading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    ensureDefaultCategories,
  };
}
