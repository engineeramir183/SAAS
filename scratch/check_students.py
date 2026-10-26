import json, urllib.request

env = {}
with open('.env', 'r') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

url = f"{env['VITE_SUPABASE_URL']}/rest/v1/students?school_id=eq.khr-107&select=id,name,grade,serial_number,admissions"
req = urllib.request.Request(url, headers={
    'apikey': env['VITE_SUPABASE_ANON_KEY'],
    'Authorization': f"Bearer {env['VITE_SUPABASE_ANON_KEY']}"
})

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print(f"Total students found: {len(data)}")
    for r in data:
        adms = r.get('admissions') or []
        bform = adms[0].get('bForm') if len(adms) > 0 and isinstance(adms[0], dict) else None
        print(f"ID: {r.get('id')} | Name: {r.get('name')} | Grade: {r.get('grade')} | BForm: {bform}")
