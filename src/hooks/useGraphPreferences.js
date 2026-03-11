import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useGraphPreferences(userId) {
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('graph_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching graph preferences:', error);
      setFavorites([]);
      setRecents([]);
    } else {
      const rows = data || [];
      let favs = rows
        .filter(r => r.is_favorite)
        .sort((a, b) => new Date(b.favorited_at) - new Date(a.favorited_at))
        .map(r => ({ itemId: r.item_id, itemName: r.item_name, lastViewedAt: r.last_viewed_at, favoritedAt: r.favorited_at }));

      // Apply stored ordering from localStorage
      try {
        const storedOrder = JSON.parse(localStorage.getItem(`graphsFavoritesOrder_${userId}`) || '[]');
        if (storedOrder.length > 0) {
          const orderMap = new Map(storedOrder.map((id, i) => [id, i]));
          favs.sort((a, b) => {
            const aIdx = orderMap.has(a.itemId) ? orderMap.get(a.itemId) : Infinity;
            const bIdx = orderMap.has(b.itemId) ? orderMap.get(b.itemId) : Infinity;
            return aIdx - bIdx;
          });
        }
      } catch (e) { /* ignore malformed localStorage */ }
      const recs = rows
        .filter(r => !r.is_favorite && r.last_viewed_at)
        .sort((a, b) => new Date(b.last_viewed_at) - new Date(a.last_viewed_at))
        .slice(0, 10)
        .map(r => ({ itemId: r.item_id, itemName: r.item_name, lastViewedAt: r.last_viewed_at }));
      setFavorites(favs);
      setRecents(recs);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      await fetchPreferences();
      if (cancelled) return;
    };
    load();
    return () => { cancelled = true; };
  }, [userId, fetchPreferences]);

  const addRecent = async (item) => {
    if (!userId || !item) return;
    const now = new Date().toISOString();

    // Optimistic update
    setRecents(prev => {
      const filtered = prev.filter(r => r.itemId !== item.id);
      return [{ itemId: item.id, itemName: item.name, lastViewedAt: now }, ...filtered].slice(0, 10);
    });
    // Also update lastViewedAt if it's a favorite
    setFavorites(prev => prev.map(f => f.itemId === item.id ? { ...f, lastViewedAt: now } : f));

    const { error } = await supabase
      .from('graph_preferences')
      .upsert({
        user_id: userId,
        item_id: item.id,
        item_name: item.name,
        last_viewed_at: now,
      }, { onConflict: 'user_id,item_id' });

    if (error) {
      console.error('Error adding recent:', error);
      return;
    }

    // Cleanup: delete oldest non-favorite rows beyond 10
    const { data: nonFavs } = await supabase
      .from('graph_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('is_favorite', false)
      .order('last_viewed_at', { ascending: false });

    if (nonFavs && nonFavs.length > 10) {
      const idsToDelete = nonFavs.slice(10).map(r => r.id);
      await supabase
        .from('graph_preferences')
        .delete()
        .in('id', idsToDelete);
    }
  };

  const toggleFavorite = async (item) => {
    if (!userId || !item) return;
    const existing = favorites.find(f => f.itemId === item.id);
    const now = new Date().toISOString();

    if (existing) {
      // Remove from favorites
      setFavorites(prev => prev.filter(f => f.itemId !== item.id));
      // Remove from stored order
      try {
        const storedOrder = JSON.parse(localStorage.getItem(`graphsFavoritesOrder_${userId}`) || '[]');
        localStorage.setItem(`graphsFavoritesOrder_${userId}`, JSON.stringify(storedOrder.filter(id => id !== item.id)));
      } catch (e) { /* ignore */ }
      // It becomes a recent if it has lastViewedAt
      if (existing.lastViewedAt) {
        setRecents(prev => {
          const filtered = prev.filter(r => r.itemId !== item.id);
          return [{ itemId: item.id, itemName: item.itemName, lastViewedAt: existing.lastViewedAt }, ...filtered].slice(0, 10);
        });
      }

      const { error } = await supabase
        .from('graph_preferences')
        .update({ is_favorite: false, favorited_at: null })
        .eq('user_id', userId)
        .eq('item_id', item.id);

      if (error) {
        console.error('Error removing favorite:', error);
        fetchPreferences();
      }
    } else {
      // Add to favorites
      setFavorites(prev => [{ itemId: item.id, itemName: item.name, lastViewedAt: now, favoritedAt: now }, ...prev]);
      // Prepend to stored order
      try {
        const storedOrder = JSON.parse(localStorage.getItem(`graphsFavoritesOrder_${userId}`) || '[]');
        localStorage.setItem(`graphsFavoritesOrder_${userId}`, JSON.stringify([item.id, ...storedOrder.filter(id => id !== item.id)]));
      } catch (e) { /* ignore */ }
      // Remove from recents since it's now a favorite
      setRecents(prev => prev.filter(r => r.itemId !== item.id));

      const { error } = await supabase
        .from('graph_preferences')
        .upsert({
          user_id: userId,
          item_id: item.id,
          item_name: item.name,
          is_favorite: true,
          favorited_at: now,
          last_viewed_at: now,
        }, { onConflict: 'user_id,item_id' });

      if (error) {
        console.error('Error adding favorite:', error);
        fetchPreferences();
      }
    }
  };

  const reorderFavorites = useCallback((orderedItemIds) => {
    localStorage.setItem(`graphsFavoritesOrder_${userId}`, JSON.stringify(orderedItemIds));
    setFavorites(prev => {
      const map = new Map(prev.map(f => [f.itemId, f]));
      const reordered = orderedItemIds.map(id => map.get(id)).filter(Boolean);
      // Append any that weren't in the ordered list
      const remaining = prev.filter(f => !orderedItemIds.includes(f.itemId));
      return [...reordered, ...remaining];
    });
  }, [userId]);

  const isFavorite = useCallback((itemId) => {
    return favorites.some(f => f.itemId === itemId);
  }, [favorites]);

  return { favorites, recents, loading, addRecent, toggleFavorite, isFavorite, reorderFavorites };
}
