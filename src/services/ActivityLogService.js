import { supabase } from '../supabaseClient';

/**
 * Service for managing audit activity logs across the platform.
 * Enforces strict multi-tenant isolation.
 */
export const ActivityLogService = {
    /**
     * Records a new security or administrative audit log.
     * 
     * @param {object} params
     * @param {string} params.schoolId - The unique ID of the school tenant
     * @param {string} params.username - The username of the operator (e.g., 'admin', 'principal')
     * @param {string} params.role - The system role of the operator ('admin', 'student', 'developer', etc.)
     * @param {string} params.action - Name of the action (e.g., 'Update Gradebook', 'Marked Attendance')
     * @param {string} [params.targetName] - The entity targeted by this action (e.g., 'Class 9th Biology')
     * @param {object} [params.details] - Any extra key-value metadata to record
     * @returns {Promise<{success: boolean, data: any, error: any}>}
     */
    async logActivity({ schoolId, username, role, action, targetName = null, details = {} }) {
        if (!schoolId) {
            console.error('Cannot log activity: schoolId is required.');
            return { success: false, error: 'schoolId is required' };
        }

        try {
            const payload = {
                school_id: schoolId,
                operator_username: username || 'unknown',
                operator_role: role || 'anonymous',
                action,
                target_name: targetName,
                details: typeof details === 'object' ? details : { raw: details },
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('activity_logs')
                .insert([payload])
                .select();

            if (error) {
                console.error('Error saving activity log to database:', error);
                return { success: false, error };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Unexpected exception in ActivityLogService.logActivity:', err);
            return { success: false, error: err };
        }
    },

    /**
     * Fetches the audit log stream for a specific school.
     * 
     * @param {string} schoolId - The ID of the school tenant
     * @param {number} [limit=100] - Limit of logs to return
     * @returns {Promise<{success: boolean, data: Array, error: any}>}
     */
    async fetchActivityLogs(schoolId, limit = 150) {
        if (!schoolId) {
            return { success: false, error: 'schoolId is required', data: [] };
        }

        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('school_id', schoolId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching activity logs:', error);
                return { success: false, error, data: [] };
            }

            return { success: true, data: data || [] };
        } catch (err) {
            console.error('Unexpected error fetching activity logs:', err);
            return { success: false, error: err, data: [] };
        }
    },

    /**
     * Fetches global activity logs across all tenants (for Super Admin).
     * 
     * @param {number} [limit=200] - Limit of logs to return
     * @returns {Promise<{success: boolean, data: Array, error: any}>}
     */
    async fetchAllActivityLogs(limit = 200) {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching global activity logs:', error);
                return { success: false, error, data: [] };
            }

            return { success: true, data: data || [] };
        } catch (err) {
            console.error('Unexpected error fetching global activity logs:', err);
            return { success: false, error: err, data: [] };
        }
    }
};
