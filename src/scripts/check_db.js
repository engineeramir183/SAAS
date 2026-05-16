import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkData = async () => {
    const { data: schools, error: sErr } = await supabase.from('schools').select('school_id, school_name');
    const { data: requests, error: rErr } = await supabase.from('school_registration_requests').select('id, status');

    console.log('--- DATABASE CHECK ---');
    console.log('Project URL:', supabaseUrl);
    if (sErr) console.error('Schools Error:', sErr.message);
    else console.log('Schools in DB:', schools.length, schools.map(s => s.school_id));

    if (rErr) console.error('Requests Error:', rErr.message);
    else console.log('Requests in DB:', requests.length);
};

checkData();
