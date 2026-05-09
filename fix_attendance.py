import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'c:\Professional Projects\SAAS\src\admin\tabs\AttendanceTab.jsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

from collections import defaultdict
func_occurrences = defaultdict(list)
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith('function ') and '(' in stripped:
        name = stripped.split('(')[0].replace('function ', '').strip()
        func_occurrences[name].append(i + 1)

print(f"Total lines: {len(lines)}")
duplicates_found = False
for name, locs in sorted(func_occurrences.items(), key=lambda x: x[1][0]):
    if len(locs) > 1:
        print(f"  STILL DUPLICATE: {name} at lines {locs}")
        duplicates_found = True

if not duplicates_found:
    print("All clear! No duplicate functions found.")
