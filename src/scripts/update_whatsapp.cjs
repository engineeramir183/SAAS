const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzdkonnqurhbfyupnkws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZGtvbm5xdXJoYmZ5dXBua3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk1OTksImV4cCI6MjA4OTk1NTU5OX0.FXW7CO2zp8n-CsjYQK7sPY-rIlIFGhJ5jjnp78hoOxk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Updating whatsapp_number in saas_info table on live Supabase...");
    const { data, error } = await supabase
        .from('saas_info')
        .update({
            business_name: 'KHR Educo',
            support_email: 'khrdigitallabs@gmail.com',
            whatsapp_number: '+92 345 7685122',
            hero_title: 'The All-in-One School OS for Modern Institutions.',
            hero_subtitle: 'Engineered by KHR Educo — the definitive multi-tenant cloud platform to instantly deploy, scale, and manage entire school ecosystems from a single dashboard.'
        })
        .eq('id', 'global')
        .select();

    if (error) {
        console.error("Error updating database:", error.message);
    } else {
        console.log("SUCCESS! Row updated successfully in Supabase:", data);
    }
}

run();
