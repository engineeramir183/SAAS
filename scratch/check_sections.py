import json, urllib.request

env = {}
with open('.env', 'r') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

url = f"{env['VITE_SUPABASE_URL']}/rest/v1/metadata?school_id=eq.khr-107&key=eq.SECTIONS"
req = urllib.request.Request(url, headers={
    'apikey': env['VITE_SUPABASE_ANON_KEY'],
    'Authorization': f"Bearer {env['VITE_SUPABASE_ANON_KEY']}"
})

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print('SECTIONS meta in DB:', json.dumps(data, indent=2))
