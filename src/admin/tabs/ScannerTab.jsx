import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { sendWhatsAppMessage, WhatsAppTemplates } from '../../services/WhatsAppService';

const ScannerTab = ({ students, setStudents, showSaveMessage, schoolName = 'School', schoolSettings }) => {
    const scannerRef = useRef(null);
    const [scannerInstance, setScannerInstance] = useState(null);
    const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
    const [lastScanned, setLastScanned] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [hasCameras, setHasCameras] = useState(true);

    const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time

    useEffect(() => {
        // Load html5-qrcode dynamically so we don't break SSR or initial load
        let Html5Qrcode;
        import('html5-qrcode').then((module) => {
            Html5Qrcode = module.Html5Qrcode;
            
            Html5Qrcode.getCameras().then(devices => {
                if (devices && devices.length) {
                    setHasCameras(true);
                    startScanner(Html5Qrcode);
                } else {
                    setHasCameras(false);
                    setErrorMsg('No cameras found on this device.');
                }
            }).catch(err => {
                setHasCameras(false);
                setErrorMsg('Camera access denied or unavailable: ' + err.message);
            });
        });

        // Cleanup on unmount
        return () => {
            if (scannerInstance) {
                scannerInstance.stop().then(() => {
                    scannerInstance.clear();
                }).catch(e => console.log('Scanner cleanup error', e));
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let isProcessing = false;

    const startScanner = (Html5QrcodeClass) => {
        if (!scannerRef.current) return;
        
        const html5QrCode = new Html5QrcodeClass("qr-reader");
        setScannerInstance(html5QrCode);
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        html5QrCode.start({ facingMode: "environment" }, config, async (decodedText) => {
            if (isProcessing) return; // Prevent double scans
            isProcessing = true;
            await handleScan(decodedText);
            // 2 second cooldown before next scan
            setTimeout(() => { isProcessing = false; }, 2000);
        }, (errorMessage) => {
            // Background scan errors (normal when no QR is in frame)
        }).catch((err) => {
            setErrorMsg("Error starting scanner: " + err.message);
        });
    };

    const handleScan = async (studentId) => {
        setScanStatus('scanning');
        
        // 1. Find the student
        const student = students.find(s => s.id === studentId);
        
        if (!student) {
            setScanStatus('error');
            setErrorMsg(`Student not found with ID: ${studentId}`);
            setLastScanned(null);
            setTimeout(() => setScanStatus('idle'), 3000);
            return;
        }

        try {
            // 2. Process Attendance Logic
            const currentRecords = student.attendance?.records || [];
            const todayRecordIndex = currentRecords.findIndex(r => r.date === todayDate);
            
            let updatedRecords = [...currentRecords];
            let alreadyMarked = false;

            if (todayRecordIndex >= 0) {
                if (updatedRecords[todayRecordIndex].status === 'present') {
                    alreadyMarked = true;
                } else {
                    updatedRecords[todayRecordIndex].status = 'present';
                }
            } else {
                updatedRecords.push({ date: todayDate, status: 'present' });
            }

            if (alreadyMarked) {
                setScanStatus('success');
                setLastScanned({ ...student, message: 'Already marked present today!' });
                setTimeout(() => setScanStatus('idle'), 3000);
                return;
            }

            // Calculate new summary totals
            const present = updatedRecords.filter(r => r.status === 'present').length;
            const absent = updatedRecords.filter(r => r.status === 'absent').length;
            const leave = updatedRecords.filter(r => r.status === 'leave').length;
            const late = updatedRecords.filter(r => r.status === 'late').length;
            
            const presentForPct = present + leave + late;
            const total = updatedRecords.length;
            const percentage = total > 0 ? parseFloat(((presentForPct / total) * 100).toFixed(1)) : 0;

            const newAttendanceObj = {
                records: updatedRecords,
                total, present, absent, leave, late, percentage
            };

            // 3. Save to Supabase
            const { error } = await supabase
                .from('students')
                .update({ attendance: newAttendanceObj })
                .eq('id', student.id)
                .eq('school_id', student.school_id);

            if (error) throw error;

            // 4. Update local state instantly for UI sync
            const updatedStudents = students.map(s => s.id === student.id ? { ...s, attendance: newAttendanceObj } : s);
            setStudents(updatedStudents);

            setScanStatus('success');
            setLastScanned({ ...student, message: `${student.name} marked PRESENT.` });
            
            // WhatsApp Automation: Safe Arrival
            if (schoolSettings?.auto_attendance_alert) {
                const parentPhone = student.admissions?.[0]?.whatsapp || student.admissions?.[0]?.contact || '';
                if (parentPhone) {
                    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const msg = WhatsAppTemplates.attendanceArrived(student.name, time, schoolName);
                    sendWhatsAppMessage(parentPhone, msg, schoolSettings);
                }
            }
            
            setTimeout(() => setScanStatus('idle'), 3000);

        } catch (err) {
            console.error(err);
            setScanStatus('error');
            setErrorMsg(`Error saving attendance: ${err.message}`);
            setTimeout(() => setScanStatus('idle'), 3000);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Camera size={28} color="#2563eb" /> QR Attendance Scanner
                    </h2>
                    <p style={{ color: '#64748b', marginTop: '0.4rem' }}>Scan student ID cards to mark instant attendance for {todayDate}.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: '2rem' }}>
                
                {/* ── Scanner Viewfinder ── */}
                <div className="card" style={{ padding: '0', overflow: 'hidden', background: '#000', borderRadius: '24px', position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    {!hasCameras && (
                        <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>
                            <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ margin: 0 }}>Camera Not Available</h3>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{errorMsg}</p>
                        </div>
                    )}
                    
                    {/* The div where html5-qrcode injects the video stream */}
                    <div id="qr-reader" ref={scannerRef} style={{ width: '100%', height: '100%' }}></div>
                    
                    {/* Transparent overlay styling (optional based on html5-qrcode settings) */}
                    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                        <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px 14px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div> Live Camera
                        </span>
                    </div>
                </div>

                {/* ── Status / Recent Scan Panel ── */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>Latest Scan Result</h3>
                    
                    <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '2px dashed #cbd5e1', background: '#f8fafc', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        
                        {scanStatus === 'idle' && !lastScanned && (
                            <div style={{ color: '#94a3b8' }}>
                                <Camera size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                                <p>Waiting for scan...</p>
                                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Hold a student ID card up to the camera.</p>
                            </div>
                        )}

                        {scanStatus === 'scanning' && (
                            <div style={{ color: '#2563eb' }}>
                                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid rgba(37,99,235,0.2)', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                                <p style={{ fontWeight: 700 }}>Processing...</p>
                            </div>
                        )}

                        {scanStatus === 'success' && lastScanned && (
                            <div className="animate-fade-in" style={{ width: '100%' }}>
                                <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                                <h3 style={{ color: '#10b981', fontSize: '1.25rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>{lastScanned.message}</h3>
                                
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '1.5rem', textAlign: 'left' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden' }}>
                                            <img src={lastScanned.photo || lastScanned.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(lastScanned.name)}&background=e2e8f0&color=64748b`} alt={lastScanned.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{lastScanned.name}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Class: {lastScanned.grade} • Roll: {lastScanned.id}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {scanStatus === 'error' && (
                            <div className="animate-fade-in">
                                <XCircle size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                                <h3 style={{ color: '#ef4444', fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>Scan Failed</h3>
                                <p style={{ color: '#7f1d1d', fontSize: '0.9rem' }}>{errorMsg}</p>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ScannerTab;
