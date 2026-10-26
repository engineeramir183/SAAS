import json, urllib.request

env = {}
with open('.env', 'r') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

# Delete ALI ZAHID dummy student without B-Form (ID: KHR-2026-006)
delete_url = f"{env['VITE_SUPABASE_URL']}/rest/v1/students?school_id=eq.khr-107&id=eq.KHR-2026-006"
req = urllib.request.Request(delete_url, method='DELETE', headers={
    'apikey': env['VITE_SUPABASE_ANON_KEY'],
    'Authorization': f"Bearer {env['VITE_SUPABASE_ANON_KEY']}"
})

try:
    with urllib.request.urlopen(req) as resp:
        print("Deleted student KHR-2026-006 successfully, status:", resp.status)
except Exception as e:
    print("Error deleting:", e)
