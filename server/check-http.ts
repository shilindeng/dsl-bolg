import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

console.log('Testing Supabase HTTP connection...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function testHttp() {
    try {
        const { data, error } = await supabase.from('test').select('*').limit(1)
        if (error) {
            // Table might not exist, but if we get a specific error it means we connected.
            // "relation 'public.test' does not exist" -> Success (Connected)
            // "FetchError" -> Failed (Network)
            console.log('⚠️ Response received (connection successful), but returned error:', error.message)
        } else {
            console.log('✅ Success! Data:', data)
        }
    } catch (e: any) {
        console.error('❌ HTTP check failed:', e.message)
    }
}

testHttp()
