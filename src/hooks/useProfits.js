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
    .maybeSingle();  // Changed from .single() to .maybeSingle()
  
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
    // No data exists yet, create initial row
    const { error: insertError } = await supabase
      .from('profits')
      .insert([{
        user_id: userId,
        dump_profit: 0,
        referral_profit: 0,
        bonds_profit: 0
      }]);
    
    if (insertError) {
      console.error('Error creating initial profits:', insertError);
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