import os
import re

directories = [
    r"c:\Users\ARMAN\OneDrive\Desktop\legalai\src\pages",
    r"c:\Users\ARMAN\OneDrive\Desktop\legalai\src\components"
]

replacements = {
    # Text colors
    r'\btext-white\b': 'text-foreground',
    r'\btext-black\b': 'text-primary-foreground',
    r'\bhover:text-white\b': 'hover:text-foreground',
    r'\btext-gray-400\b': 'text-muted-foreground',
    r'\btext-zinc-400\b': 'text-muted-foreground',
    r'\btext-slate-400\b': 'text-muted-foreground',
    r'\btext-slate-300\b': 'text-muted-foreground',
    
    # Background colors
    r'\bbg-black\b': 'bg-background',
    r'\bbg-white\b': 'bg-primary',
    r'\bhover:bg-white\/10\b': 'hover:bg-border/50',
    r'\bbg-zinc-900\b': 'bg-card',
    r'\bbg-zinc-950\b': 'bg-background',
    r'\bbg-[#0A0A0A]\b': 'bg-card',
    
    # Border colors
    r'\bborder-white\/10\b': 'border-border',
    r'\bborder-white\/20\b': 'border-border/50',
    r'\bborder-zinc-800\b': 'border-border',
}

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(('.jsx', '.tsx', '.js')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    for pattern, repl in replacements.items():
                        content = re.sub(pattern, repl, content)
                    
                    if content != original_content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Updated {file}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

print("Migration complete.")
