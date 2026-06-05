import os
import urllib.request
import json
import time

dest_dir = r"c:\Users\22061\Desktop\西方塔罗\assets\images\cards"
os.makedirs(dest_dir, exist_ok=True)

tree_url = 'https://api.github.com/repos/kinangram/tarot_images/git/trees/main?recursive=1'
req = urllib.request.Request(tree_url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read().decode())
        imgs = [d['path'] for d in data['tree'] if d['path'].endswith('.jpg')]
        
        print(f"Found {len(imgs)} images. Starting download...")
        for idx, img in enumerate(imgs):
            raw_url = f"https://raw.githubusercontent.com/kinangram/tarot_images/main/{urllib.parse.quote(img)}"
            local_path = os.path.join(dest_dir, os.path.basename(img))
            if not os.path.exists(local_path):
                img_req = urllib.request.Request(raw_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(img_req) as ir:
                    with open(local_path, 'wb') as f:
                        f.write(ir.read())
                print(f"[{idx+1}/{len(imgs)}] Downloaded {img}")
                time.sleep(0.1) # Be polite to github
            else:
                print(f"[{idx+1}/{len(imgs)}] Skipped {img} (already exists)")
except Exception as e:
    print('Failed:', e)
