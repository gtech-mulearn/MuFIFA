const { createClient } = require("@supabase/supabase-js");

let supabaseInstance = null;
let initialized = false;

function getSupabaseClient() {
  if (initialized) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  initialized = true;
  return supabaseInstance;
}

// Create a proxy that forwards everything to the dynamic supabase client
const supabaseProxy = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      return undefined;
    }
    return client[prop];
  }
});

module.exports = supabaseProxy;
