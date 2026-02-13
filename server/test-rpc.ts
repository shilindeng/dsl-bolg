import { supabaseAdmin } from './src/lib/supabase';

async function test() {
    console.log('Testing RPC increment_page_view...');
    try {
        const { data, error } = await supabaseAdmin.rpc('increment_page_view', { page_slug: 'hello-world' });
        if (error) {
            console.error('RPC Error:', error);
        } else {
            console.log('RPC Success:', data);
        }
    } catch (err) {
        console.error('RPC Exception:', err);
    }
}

test();
