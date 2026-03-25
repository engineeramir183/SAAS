import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminContext
//
// Handles everything at the SaaS platform level:
//   - Super Admin authentication
//   - CRUD on the `schools` table (register/deactivate schools)
//   - Platform-wide analytics (total students, total schools, etc.)
//
// This context is completely separate from SchoolDataContext.
// School admins never have access to SuperAdminContext.
// ─────────────────────────────────────────────────────────────────────────────

const SuperAdminContext = createContext();

export const useSuperAdmin = () => {
    const context = useContext(SuperAdminContext);
    if (!context) throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
    return context;
};

export const SuperAdminProvider = ({ children }) => {
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [schools,      setSchools]      = useState([]);
    const [saasInfo,     setSaasInfo]     = useState(null);
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState(null);

    // ─── Authentication ───────────────────────────────────────────────────────
    const loginSuperAdmin = async (username, password) => {
        setError(null);
        const { data, error: err } = await supabase
            .from('super_admins')
            .select('*')
            .eq('username', username)
            .eq('password', password)   // TODO: bcrypt in production
            .single();

        if (err || !data) {
            setError('Invalid Super Admin credentials.');
            return { success: false };
        }

        setIsSuperAdmin(true);
        await fetchAllSchools();
        return { success: true };
    };

    const logoutSuperAdmin = () => {
        setIsSuperAdmin(false);
        setSchools([]);
    };

    // ─── School Registry ──────────────────────────────────────────────────────
    const fetchAllSchools = async () => {
        setLoading(true);
        const { data, error: err } = await supabase
            .from('schools')
            .select('*, school_info(*)')
            .order('created_at', { ascending: false });

        if (!err) setSchools(data || []);
        setLoading(false);
        return { data, error: err };
    };

    const fetchSaasInfo = async () => {
        const { data, error: err } = await supabase
            .from('saas_info')
            .select('*')
            .eq('id', 'global')
            .maybeSingle();
        
        if (!err && data) setSaasInfo(data);
        return { data, error: err };
    };

    const updateSaasInfo = async (updates) => {
        const { error: err } = await supabase
            .from('saas_info')
            .update(updates)
            .eq('id', 'global');
        
        if (!err) await fetchSaasInfo();
        return { error: err };
    };

    /**
     * Register a brand-new school.
     * Creates the `schools` row AND seeds the first admin account
     * so the school administrator can log in immediately.
     *
     * @param {object} schoolPayload  - { school_id, school_name, country, currency_symbol, contact_email }
     * @param {object} adminPayload   - { username, password }
     */
    const registerSchool = async (schoolPayload, adminPayload) => {
        setError(null);

        // 1. Insert school into the `schools` registry
        const { error: schoolErr } = await supabase
            .from('schools')
            .insert([{
                school_id:       schoolPayload.school_id,
                school_name:     schoolPayload.school_name,
                country:         schoolPayload.country         || 'Pakistan',
                currency_symbol: schoolPayload.currency_symbol || 'RS',
                contact_email:   schoolPayload.contact_email   || null,
                is_active:       true,
                plan:            schoolPayload.plan            || 'basic',
            }]);

        if (schoolErr) {
            setError(schoolErr.message);
            return { success: false, error: schoolErr };
        }

        // 2. Seed school_info row (blank — school fills in later)
        await supabase.from('school_info').insert([{
            school_id: schoolPayload.school_id,
            name:      schoolPayload.school_name,
        }]);

        // 3. Create the first admin account for this school
        const { error: adminErr } = await supabase
            .from('admins')
            .insert([{
                school_id: schoolPayload.school_id,
                username:  adminPayload.username,
                password:  adminPayload.password,
                role:      'admin',
            }]);

        if (adminErr) {
            setError(adminErr.message);
            return { success: false, error: adminErr };
        }

        // 4. Refresh the schools list
        await fetchAllSchools();
        return { success: true };
    };

    /**
     * Deactivate (soft-delete) a school.
     * Data is preserved; the school simply cannot log in.
     */
    const deactivateSchool = async (schoolId) => {
        const { error: err } = await supabase
            .from('schools')
            .update({ is_active: false })
            .eq('school_id', schoolId);

        if (!err) await fetchAllSchools();
        return { error: err };
    };

    /**
     * Reactivate a previously deactivated school.
     */
    const reactivateSchool = async (schoolId) => {
        const { error: err } = await supabase
            .from('schools')
            .update({ is_active: true })
            .eq('school_id', schoolId);

        if (!err) await fetchAllSchools();
        return { error: err };
    };

    return (
        <SuperAdminContext.Provider value={{
            isSuperAdmin,
            schools,
            saasInfo,
            loading,
            error,
            loginSuperAdmin,
            logoutSuperAdmin,
            fetchAllSchools,
            fetchSaasInfo,
            updateSaasInfo,
            registerSchool,
            deactivateSchool,
            reactivateSchool,
        }}>
            {children}
        </SuperAdminContext.Provider>
    );
};
