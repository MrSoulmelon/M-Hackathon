import os
import re

directory = r'c:\Ragini\M-Hackathon\frontend\src'

# rgba(167, 139, 250, 0.7) is the current purple
# We change it to a bright icy blue: rgba(125, 211, 252, 0.8)

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            content = content.replace("color: 'rgba(167, 139, 250, 0.7)'", "color: 'rgba(125, 211, 252, 0.8)'")
            
            if content != orig_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {path}")
