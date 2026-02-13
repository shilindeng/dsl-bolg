import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SERVER: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check .env file.');
}


// 服务端使用 service_role key (绕过 RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 客户端使用 anon key (受 RLS 约束)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseUrl, supabaseAnonKey };
