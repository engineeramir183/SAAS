const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzdkonnqurhbfyupnkws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZGtvbm5xdXJoYmZ5dXBua3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk1OTksImV4cCI6MjA4OTk1NTU5OX0.FXW7CO2zp8n-CsjYQK7sPY-rIlIFGhJ5jjnp78hoOxk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Querying push_subscriptions table...');
    const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*');
        
    if (error) {
        console.error('Error fetching subscriptions:', error);
    } else {
        console.log('Active push subscriptions found:', data.length);
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
