export default async function handler(req, res) {
    // Enable CORS headers for development/production
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, message, whatsapp_api_key, whatsapp_phone_id } = req.body || {};

        if (!to || !message || !whatsapp_api_key || !whatsapp_phone_id) {
            return res.status(400).json({ error: 'Missing required parameters: to, message, whatsapp_api_key, whatsapp_phone_id' });
        }

        // Clean and format recipient phone number
        const cleanNumber = to.replace(/\D/g, '');
        const recipient = cleanNumber.startsWith('92') ? cleanNumber : `92${cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber}`;

        const url = `https://graph.facebook.com/v17.0/${whatsapp_phone_id}/messages`;
        
        console.log(`Forwarding WhatsApp request for ${recipient} to Meta API...`);

        const response = await fetch(url, {
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
        
        if (!response.ok) {
            console.error('Meta API Error:', data);
            return res.status(response.status).json({ 
                error: data.error?.message || 'Meta API returned an error.' 
            });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Serverless Function Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
