import os

directory = r'c:\Ragini\M-Hackathon\frontend\src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            content = content.replace("color: 'rgba(125, 211, 252, 0.8)'", "color: '#ffffff'")
            
            if content != orig_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {path}")
