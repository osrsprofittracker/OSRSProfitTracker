import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProfits(userId) {
  const [profits, setProfits] = useState({
    dumpProfit: 0,
    referralProfit: 0,
    bondsProfit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchProfits();
  }, [userId]);

  const fetchProfits = async () => {
    const { data, error } = await supabase
      .from('profits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profits:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setProfits({
        dumpProfit: data.dump_profit || 0,
        referralProfit: data.referral_profit || 0,
        bondsProfit: data.bonds_profit || 0
      });
    } else {
      // No data exists yet, use upsert to handle race conditions
      const { data: upsertData, error: upsertError } = await supabase
        .from('profits')
        .upsert({
          user_id: userId,
          dump_profit: 0,
          referral_profit: 0,
          bonds_profit: 0
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error creating/fetching initial profits:', upsertError);
      } else if (upsertData) {
        setProfits({
          dumpProfit: upsertData.dump_profit || 0,
          referralProfit: upsertData.referral_profit || 0,
          bondsProfit: upsertData.bonds_profit || 0
        });
      }
    }
    setLoading(false);
  };

  const updateProfit = async (profitType, amount) => {
    // Convert camelCase to snake_case
    const dbColumnMap = {
      dumpProfit: 'dump_profit',
      referralProfit: 'referral_profit',
      bondsProfit: 'bonds_profit'
    };

    const dbColumn = dbColumnMap[profitType];
    const newValue = profits[profitType] + amount;

    const { error } = await supabase
      .from('profits')
      .upsert({
        user_id: userId,
        [dbColumn]: newValue
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating profit:', error);
      return false;
    } else {
      setProfits({ ...profits, [profitType]: newValue });
      return true;
    }
  };

  return { profits, loading, updateProfit, refetch: fetchProfits };
}