import urllib.request
import re
import json

req = urllib.request.Request('https://en.wikipedia.org/wiki/Rider-Waite_Tarot', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as r:
        html = r.read().decode('utf-8')
        images = list(set(re.findall(r'src="([^"]+RWS_Tarot[^"]+\.jpg)"', html)))
        print(f'Found {len(images)} images.')
        print(images[:5])
except Exception as e:
    print('Failed:', e)
