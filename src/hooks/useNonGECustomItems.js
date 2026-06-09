import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapRow } from '../utils/mapRow';

const CUSTOM_ITEM_KEY_MAP = {
  id: 'id',
  name: 'name',
  wikiUrl: ['wiki_url', ''],
  imageUrl: ['image_url', ''],
  sourceName: ['source_name', 'Custom'],
  rangeLabel: ['range_label', 'Unknown'],
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const formatCustomItem = (row) => mapRow(row, CUSTOM_ITEM_KEY_MAP);

export function useNonGECustomItems(userId) {
  const [customItems, setCustomItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomItems = useCallback(async () => {
    if (!userId) {
      setCustomItems([]);
      setLoading(false);
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('non_ge_custom_items')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedItems = (data || []).map(formatCustomItem);
      setCustomItems(formattedItems);
      return formattedItems;
    } catch (error) {
      console.error('Error fetching Non-GE custom items:', error);
      setCustomItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCustomItems();
  }, [fetchCustomItems]);

  const addCustomItem = useCallback(async (item) => {
    try {
      const { data, error } = await supabase
        .from('non_ge_custom_items')
        .insert([{
          user_id: userId,
          name: item.name,
          wiki_url: item.wikiUrl || null,
          image_url: item.imageUrl || null,
          source_name: item.sourceName || 'Custom',
          range_label: item.rangeLabel || 'Unknown',
        }])
        .select()
        .single();

      if (error) throw error;

      return formatCustomItem(data);
    } catch (error) {
      console.error('Error adding Non-GE custom item:', error);
      throw error;
    }
  }, [userId]);

  const updateCustomItem = useCallback(async (id, updates) => {
    const dbUpdates = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.wikiUrl !== undefined) dbUpdates.wiki_url = updates.wikiUrl || null;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl || null;
    if (updates.sourceName !== undefined) dbUpdates.source_name = updates.sourceName || 'Custom';
    if (updates.rangeLabel !== undefined) dbUpdates.range_label = updates.rangeLabel || 'Unknown';

    try {
      const { error } = await supabase
        .from('non_ge_custom_items')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating Non-GE custom item:', error);
      throw error;
    }
  }, [userId]);

  const deleteCustomItem = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('non_ge_custom_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting Non-GE custom item:', error);
      throw error;
    }
  }, [userId]);

  return {
    customItems,
    loading,
    fetchCustomItems,
    addCustomItem,
    updateCustomItem,
    deleteCustomItem,
  };
}
