import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define order to respect foreign keys
const TABLES_ORDER = [
    'schools',
    'school_info',
    'admins',
    'faculty',
    'facilities',
    'testimonials',
    'announcements',
    'blogs',
    'students',
    'metadata',
    'activity_logs'
];

const restoreDatabase = async (backupFile) => {
    try {
        console.log(`🔄 Starting database restoration from: ${backupFile}\n`);

        if (!fs.existsSync(backupFile)) {
            console.error('❌ Error: Backup file not found!');
            process.exit(1);
        }

        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
        const tables = backupData.tables;

        for (const table of TABLES_ORDER) {
            const data = tables[table];
            if (!data || data.length === 0) {
                console.log(`  ⚪ ${table}: No data to restore.`);
                continue;
            }

            console.log(`  ⏳ Restoring ${table} (${data.length} rows)...`);
            
            // Clean data: remove problematic fields if necessary
            // For example, if some tables have triggers that auto-fill fields, 
            // we might want to keep the original IDs.
            
            // We use upsert to avoid duplicate errors and update existing records
            // We chunk the data to avoid payload size limits
            const CHUNK_SIZE = 100;
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                const { error } = await supabase
                    .from(table)
                    .upsert(chunk);

                if (error) {
                    console.error(`    ❌ Error in ${table} (chunk ${i/CHUNK_SIZE + 1}):`, error.message);
                }
            }
            console.log(`  ✅ ${table}: Restore complete.`);
        }

        console.log('\n🎉 Database restoration finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Restoration failed:', err.message);
        process.exit(1);
    }
};

// Use the specific backup file found
const BACKUP_PATH = path.resolve('backups/backup_2026-05-16T09-37-33.json');
restoreDatabase(BACKUP_PATH);
