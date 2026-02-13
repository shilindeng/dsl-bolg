import { supabaseAdmin } from './src/lib/supabase.js';

async function check() {
    console.log('Checking access to PostTags...');
    const { data, error } = await supabaseAdmin.from('PostTags').select('*').limit(1);
    if (error) {
        console.error('Error accessing PostTags:', error);
    } else {
        console.log('Success! PostTags data:', data);
    }
}

check();
