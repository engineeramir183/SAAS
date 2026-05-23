const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzdkonnqurhbfyupnkws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZGtvbm5xdXJoYmZ5dXBua3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk1OTksImV4cCI6MjA4OTk1NTU5OX0.FXW7CO2zp8n-CsjYQK7sPY-rIlIFGhJ5jjnp78hoOxk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Querying schools table...');
    const { data, error } = await supabase
        .from('schools')
        .select('school_id, push_notifications_enabled, auto_push_attendance_alert, auto_push_fee_alert, auto_push_diary_alert')
        .eq('school_id', 'acs-001')
        .single();
        
    if (error) {
        console.error('Error fetching schools:', error);
    } else {
        console.log('Active school settings:', JSON.stringify(data, null, 2));
    }
}

check();
