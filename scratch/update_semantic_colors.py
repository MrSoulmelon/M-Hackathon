import os
import re

directory = r'c:\Ragini\M-Hackathon\frontend\src'

# amber -> violet (Warning/At-Risk)
# rose -> fuchsia (Critical/Systemic)
# emerald -> sky (Stable/Healthy)

mappings = {
    # Red/Rose -> Fuchsia
    r'\brose-200\b': 'fuchsia-200',
    r'\brose-300\b': 'fuchsia-300',
    r'\brose-400\b': 'fuchsia-400',
    r'\brose-500\b': 'fuchsia-500',
    r'\brose-600\b': 'fuchsia-600',
    r'\brose-700\b': 'fuchsia-700',
    r'\brose-800\b': 'fuchsia-800',
    r'\brose-900\b': 'fuchsia-900',
    r'\brose-950\b': 'fuchsia-950',
    r'\bred-500\b': 'fuchsia-500',

    # Amber -> Violet
    r'\bamber-300\b': 'violet-300',
    r'\bamber-400\b': 'violet-400',
    r'\bamber-500\b': 'violet-500',
    r'\bamber-600\b': 'violet-600',
    r'\bamber-700\b': 'violet-700',
    r'\bamber-800\b': 'violet-800',
    r'\bamber-900\b': 'violet-900',
    r'\bamber-950\b': 'violet-950',

    # Emerald -> Sky
    r'\bemerald-300\b': 'sky-300',
    r'\bemerald-400\b': 'sky-400',
    r'\bemerald-500\b': 'sky-500',
    r'\bemerald-600\b': 'sky-600',
    r'\bemerald-800\b': 'sky-800',
    r'\bemerald-900\b': 'sky-900',
    r'\bemerald-950\b': 'sky-950',
    
    # Specific textual adjustments if any
    r'text-amber-800': 'text-violet-300', # Fix dark text on dark bg issue seen in AlertBanner (+X More)
    r'text-amber-700': 'text-violet-300',
}

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            for pattern, replacement in mappings.items():
                content = re.sub(pattern, replacement, content)
            
            if content != orig_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {path}")
