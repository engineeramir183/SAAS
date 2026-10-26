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
    const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', 'khr-107')
        .order('id', { ascending: false });
    
    console.log('Students in khr-107:', students ? students.length : 0);
    if (students) {
        students.forEach(s => {
            console.log(`ID: ${s.id} | Name: ${s.name} | Grade: '${s.grade}' | Serial: ${s.serial_number}`);
            console.log('  Adm:', JSON.stringify(s.admissions));
        });
    }
}
main();
