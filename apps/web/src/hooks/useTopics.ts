import { useEffect, useState } from 'react';
import { supabase } from "../lib/supabaseClient";


export function useTopics() {
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data, error } = await supabase.from('topics').select('*');
      if (!error) setTopics(data);
    };
    fetchTopics();
  }, []);

  return topics;
}
