const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzdkonnqurhbfyupnkws.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZGtvbm5xdXJoYmZ5dXBua3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk1OTksImV4cCI6MjA4OTk1NTU5OX0.FXW7CO2zp8n-CsjYQK7sPY-rIlIFGhJ5jjnp78hoOxk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkKeys() {
    try {
        const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .eq('school_id', 'pmhs-004')
            .limit(1);
        if (error) throw error;
        if (students.length > 0) {
            console.log('Student row keys:', Object.keys(students[0]));
            console.log('Full Student Row:', students[0]);
        } else {
            console.log('No students found.');
        }
    } catch (e) {
        console.error(e);
    }
}

checkKeys();
