import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uqyqxudsllnbbxazzlny.supabase.co";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_94U49CYZNsuhTYoFIg9Tdg_7aRQz89a";

export const supabase = createClient(supabaseUrl, supabaseAnon);

