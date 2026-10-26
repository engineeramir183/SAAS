const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.trim().split('=');
    if (parts.length >= 2) env[parts[0]] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
    const { data: schools, error } = await supabase.from('schools').select('*');
    if (error) {
        console.error('Error fetching schools:', error);
        return;
    }
    console.log('Schools count:', schools ? schools.length : 0);
    schools.forEach(s => {
        console.log(`\nSchool ID: ${s.school_id} (${s.name})`);
    });

    const { data: meta } = await supabase.from('school_metadata').select('*');
    console.log('\nschool_metadata rows:', meta ? meta.length : 0);
    if (meta) {
        meta.forEach(m => console.log(m.school_id, m.key, JSON.stringify(m.value)));
    }
}
main();
