export const mockProfiles: Record<string, any> = {};
export const mockPreferences: Record<string, any> = {};

function parseSelectQuery(query: string) {
  const result: any = {};
  let depth = 0;
  let current = '';
  let parent: string | null = null;

  for (let i = 0; i < query.length; i++) {
    const char = query[i];

    if (char === '(') {
      depth++;
      parent = current.trim();
      current = '';
    } else if (char === ')') {
      depth--;
      const nested = parseSelectQuery(current);
      if (parent) {
        result[parent] = nested;
      }
      current = '';
      parent = null;
    } else if (char === ',' && depth === 0) {
      if (current.trim()) {
        if (parent) {
          result[parent] = current.trim();
        } else {
          result[current.trim()] = true;
        }
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    if (parent) {
      result[parent] = current.trim();
    } else {
      result[current.trim()] = true;
    }
  }

  return result;
}


function pickFields(obj: any, query: string) {
  if (!query || query.trim() === '*') return obj;
  const parsed = parseSelectQuery(query);

  const result: Record<string, any> = {};
  for (const key in parsed) {
    if (typeof parsed[key] === 'object') {
      // Nested relation
      if (Array.isArray(obj[key])) {
        result[key] = obj[key].map((item: any) => pickFields(item, Object.keys(parsed[key]).join(',')));
      } else if (obj[key] && typeof obj[key] === 'object') {
        result[key] = pickFields(obj[key], Object.keys(parsed[key]).join(','));
      } else {
        result[key] = [];
      }
    } else {
      // Simple field
      const fieldName = key.includes(':') ? key.split(':')[0] : key;
      if (obj[fieldName] !== undefined) {
        result[key] = obj[fieldName];
      }
    }
  }
  return result;
}

export const supabaseAdmin = {
  from: (table: string) => ({
    select: (query: string) => ({
      eq: (key: string, value: string) => ({
        single: async () => {
          let data: any = null;

          if (table === 'profiles') {
            if (key !== 'id') {
              return { data: null, error: `Filtering by ${key} not supported in mock` };
            }
            const profile = mockProfiles[value];
            if (!profile) return { data: null, error: 'Profile not found' };
            data = pickFields(profile, query);
          }

          else if (table === 'user_match_preferences') {
            if (key !== 'id') {
              return { data: null, error: `Filtering by ${key} not supported in mock` };
            }
            const prefs = mockPreferences[value];
            data = prefs ? pickFields(prefs, query) : null;
          }

          else {
            return { data: null, error: 'Table not found' };
          }

          return { data, error: null };
        },
        maybeSingle: async () => {
          if (table !== 'user_match_preferences') {
            return { data: null, error: 'maybeSingle only supported for user_match_preferences in mock' };
          }
          const prefs = mockPreferences[value] ?? null;
          const data = prefs ? pickFields(prefs, query) : null;
          return { data, error: null };
        }
      })
    })
  })
};
