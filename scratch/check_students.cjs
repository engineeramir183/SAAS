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
    const { data, error } = await supabase
        .from('students')
        .select('id, name, grade, serial_number, admissions, school_id')
        .order('id', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Recent 10 students:');
    data.forEach(s => {
        console.log(`ID: ${s.id} | Name: ${s.name} | Grade: '${s.grade}' | School: ${s.school_id} | Serial: ${s.serial_number}`);
        if (s.admissions && s.admissions[0]) {
            console.log('   Adm bForm:', s.admissions[0].bForm, '| contact:', s.admissions[0].contact, '| applyingFor:', s.admissions[0].applyingFor);
        }
    });
}
main();
