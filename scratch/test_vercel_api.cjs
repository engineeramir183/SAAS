async function test() {
    const apiUrl = 'https://khrlabs.vercel.app/api/send-push-notification';
    const token = "fZP9OSh_xuMJ1nlLJPiuYy:APA91bFo0ic-HeUriQtdf00S_SxQoslDpmGw2LRVU46_YTtpcuv6w_sBbw1HsnCeaYaLZrM04x8m0xpCO60dsYGefGGDmGrdpT2HvknIhbbl8skR3l5BVww"; // Edge token

    console.log('Testing Vercel API at:', apiUrl);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                title: "⚠️ Attendance Alert",
                body: "FCM Test Push from Vercel API Script",
                school_id: "acs-001"
            })
        });
        
        const result = await response.json();
        console.log('Vercel API Response Status:', response.status);
        console.log('Vercel API Response Body:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('API Test Error:', e);
    }
}

test();
