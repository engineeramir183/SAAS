/**
 * WhatsAppService.js
 * Centralized service for sending WhatsApp messages using Meta Cloud API
 * Fallback to console/logging if API is not configured.
 */

export const sendWhatsAppMessage = async (to, message, settings) => {
    // Clean phone number
    const cleanNumber = to.replace(/\D/g, '');
    const recipient = cleanNumber.startsWith('92') ? cleanNumber : `92${cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber}`;

    const { whatsapp_api_key, whatsapp_phone_id } = settings || {};

    // If API is NOT configured, we log it (or we could use wa.me links as fallback UI-driven)
    if (!whatsapp_api_key || !whatsapp_phone_id) {
        console.log(`[WhatsApp Fallback] No API Key. Link: https://wa.me/${recipient}?text=${encodeURIComponent(message)}`);
        return { success: false, mode: 'fallback', url: `https://wa.me/${recipient}?text=${encodeURIComponent(message)}` };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${whatsapp_phone_id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whatsapp_api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: recipient,
                type: "text",
                text: { 
                    preview_url: true,
                    body: message 
                }
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Failed to send WhatsApp message');
        
        return { success: true, data };
    } catch (error) {
        console.error('WhatsApp API Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Pre-defined message templates
 */
export const WhatsAppTemplates = {
    attendanceAbsent: (studentName, date, schoolName) => 
        `Dear Parent, this is to inform you that ${studentName} is ABSENT today (${date}). Please ensure regular attendance. \n- Regards, ${schoolName}`,
    
    feePaid: (studentName, month, amount, balance, schoolName) => 
        `Fee received! ${amount} for ${month} (${studentName}). Remaining Balance: ${balance}. Thank you for your payment. \n- ${schoolName}`,
    
    admissionWelcome: (studentName, studentId, schoolName) => 
        `Welcome to ${schoolName}! ${studentName} has been successfully registered with ID: ${studentId}. We look forward to a bright future together!`,
    
    attendanceArrived: (studentName, time, schoolName) => 
        `Safe Arrival: Dear Parent, ${studentName} has arrived safely at school at ${time}. \n- Regards, ${schoolName}`,

    registrationRequest: (schoolName, requestId) => 
        `Hello! We have received your registration request for *${schoolName}*. \nRequest ID: ${requestId} \nOur team will review your application within 24 hours. You will receive another message once approved!`,

    registrationApproval: (schoolName, dashboardUrl) => 
        `Congratulations! Your school *${schoolName}* has been approved on our SaaS platform. \nYou can now login to your admin portal at: ${dashboardUrl} \nWelcome aboard!`,
};
