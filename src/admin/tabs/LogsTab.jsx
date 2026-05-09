import React, { useState, useEffect } from 'react';
import { Search, RotateCw, ShieldAlert, CheckCircle, Clock, ShieldCheck, Filter } from 'lucide-react';
import { ActivityLogService } from '../../services/ActivityLogService';

const LogsTab = ({ currentSchoolId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');

    const loadLogs = async () => {
        setLoading(true);
        const { data } = await ActivityLogService.fetchActivityLogs(currentSchoolId);
        setLogs(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSchoolId]);

    // Extract unique actions for the filter select
    const uniqueActions = ['all', ...new Set(logs.map(log => log.action))];

    // Filtered logs list
    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.operator_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.target_name && log.target_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesRole = roleFilter === 'all' || log.operator_role === roleFilter;
        const matchesAction = actionFilter === 'all' || log.action === actionFilter;

        return matchesSearch && matchesRole && matchesAction;
    });

    const getActionBadgeColor = (action) => {
        const act = action.toLowerCase();
        if (act.includes('login')) return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }; // Sky
        if (act.includes('mark') || act.includes('attendance')) return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }; // Green
        if (act.includes('gradebook') || act.includes('marks')) return { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' }; // Purple
        if (act.includes('register') || act.includes('student')) return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }; // Blue
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }; // Slate default
    };

    const getRoleIcon = (role) => {
        if (role === 'admin') return <ShieldCheck size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />;
        return <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />;
    };

    return (
        <div className="animate-fade-in">
            {/* Header section with real-time controls */}
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Administrative Logs</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>View chronological audit trails of student updates, exams, and teacher logins.</p>
                </div>
                <button 
                    onClick={loadLogs} 
                    className="btn" 
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={loading}
                >
                    <RotateCw size={16} className={loading ? "animate-spin" : ""} /> {loading ? "Syncing..." : "Sync Logs"}
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Logs</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a8a', marginTop: '0.25rem' }}>{logs.length}</div>
                </div>
                <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Users</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#064e3b', marginTop: '0.25rem' }}>
                        {new Set(logs.map(l => l.operator_username)).size}
                    </div>
                </div>
                <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logins Today</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4c1d95', marginTop: '0.25rem' }}>
                        {logs.filter(l => l.action.toLowerCase() === 'login' && new Date(l.created_at).toDateString() === new Date().toDateString()).length}
                    </div>
                </div>
                <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database Security</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#78350f', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ShieldCheck size={18} color="#059669" /> Isolated
                    </div>
                </div>
            </div>

            {/* Filter Bar Panel */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Search logs by action, username, or target..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%', height: '40px' }}
                    />
                </div>
                
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <select 
                        className="form-input" 
                        value={roleFilter} 
                        onChange={e => setRoleFilter(e.target.value)}
                        style={{ height: '40px' }}
                    >
                        <option value="all">🎭 All Roles</option>
                        <option value="admin">🔑 Admin</option>
                        <option value="student">🎓 Student</option>
                        <option value="developer">🛠️ Developer</option>
                    </select>
                </div>

                <div style={{ flex: 1, minWidth: '150px' }}>
                    <select 
                        className="form-input" 
                        value={actionFilter} 
                        onChange={e => setActionFilter(e.target.value)}
                        style={{ height: '40px', textTransform: 'capitalize' }}
                    >
                        <option value="all">⚡ All Actions</option>
                        {uniqueActions.filter(act => act !== 'all').map(act => (
                            <option key={act} value={act}>{act}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Logs List Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {filteredLogs.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Time</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Operator</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Action</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Target</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Change Context</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log) => {
                                    const badge = getActionBadgeColor(log.action);
                                    return (
                                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s ease' }} className="hover-light">
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                                                        {log.operator_username}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                                                        {getRoleIcon(log.operator_role)} {log.operator_role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '999px', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: 700,
                                                    background: badge.bg,
                                                    color: badge.text,
                                                    border: `1px solid ${badge.border}`
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                                                {log.target_name || '—'}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                {log.details && Object.keys(log.details).length > 0 ? (
                                                    <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {JSON.stringify(log.details)}
                                                    </code>
                                                ) : (
                                                    <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>None</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
                        <ShieldAlert size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No matching logs found</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Try refining your search terms or adjustments above</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsTab;
