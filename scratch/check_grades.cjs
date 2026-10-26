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
        .select('id, name, grade, school_id')
        .limit(200);
    
    const bySchool = {};
    students.forEach(s => {
        if (!bySchool[s.school_id]) bySchool[s.school_id] = {};
        bySchool[s.school_id][s.grade] = (bySchool[s.school_id][s.grade] || 0) + 1;
    });

    console.log('Students by School and Grade:');
    console.log(JSON.stringify(bySchool, null, 2));
}
main();
