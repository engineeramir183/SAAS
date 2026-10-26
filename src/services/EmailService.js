/**
 * EmailService.js
 * Service for sending automated emails.
 * Uses EmailJS or a custom webhook for delivery.
 */

export const sendEmail = async (to_email, subject, message, settings) => {
    const { email_service_key } = settings || {};

    if (!email_service_key) {
        console.log(`[Email Fallback] No API Key. To: ${to_email}, Sub: ${subject}, Msg: ${message}`);
        return { success: false, mode: 'fallback' };
    }

    try {
        // TODO: Wire up EmailJS or a custom serverless endpoint.
        // The integration is intentionally unimplemented — return not_implemented
        // so callers can distinguish "sent" from "not configured".
        /*
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: 'default_service',
                template_id: 'template_id',
                user_id: email_service_key,
                template_params: { to_email, subject, message }
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'EmailJS error');
        return { success: true };
        */

        console.warn(`[EmailService] Email delivery not implemented. To: ${to_email}, Subject: ${subject}`);
        return { success: false, mode: 'not_implemented' };
    } catch (error) {
        console.error('Email Service Error:', error);
        return { success: false, error: error.message };
    }
};
