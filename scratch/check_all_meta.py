import json, urllib.request

env = {}
with open('.env', 'r') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

url = f"{env['VITE_SUPABASE_URL']}/rest/v1/metadata?school_id=eq.khr-107&select=key,value"
req = urllib.request.Request(url, headers={
    'apikey': env['VITE_SUPABASE_ANON_KEY'],
    'Authorization': f"Bearer {env['VITE_SUPABASE_ANON_KEY']}"
})

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("Metadata keys in khr-107:")
    for item in data:
        val = item.get('value')
        length = len(val) if isinstance(val, (list, dict)) else type(val)
        print(f"Key: {item.get('key')} | Value count/type: {length}")
