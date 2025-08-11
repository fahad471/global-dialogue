import { useEffect, useState } from 'react';
import { supabase } from "../lib/supabaseClient";

export interface Topic {
  id: string;
  name: string;
  category: string; // <-- added
}

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name, category'); // <-- make sure we fetch category
      if (!error && data) {
        setTopics(data as Topic[]);
      }
    };
    fetchTopics();
  }, []);

  return topics;
}
