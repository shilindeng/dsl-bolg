import { supabaseAdmin } from './src/lib/supabase.js';

async function check() {
    console.log('Checking access to _PostTags...');
    const { data, error } = await supabaseAdmin.from('_PostTags').select('*').limit(1);
    if (error) {
        console.error('Error accessing _PostTags:', error);
    } else {
        console.log('Success! _PostTags data:', data);
    }
}

check();
