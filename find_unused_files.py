#!/usr/bin/env python3
"""
Script to find unused files in the frontend and backend directories
"""
import os
import re
from pathlib import Path
from typing import Set, Dict, List

def find_all_files(directory: str, extensions: List[str]) -> Set[Path]:
    """Find all files with given extensions in directory"""
    files = set()
    for ext in extensions:
        files.update(Path(directory).rglob(f"*.{ext}"))
    return files

def extract_imports(file_path: Path) -> Set[str]:
    """Extract all local imports from a file"""
    imports = set()
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Frontend patterns (JavaScript/JSX)
            if file_path.suffix in ['.js', '.jsx', '.ts', '.tsx']:
                # import X from './path'
                # import { X } from './path'
                patterns = [
                    r"import\s+.*?from\s+['\"](\./[^'\"]+)['\"]",
                    r"import\s+.*?from\s+['\"](\.\./[^'\"]+)['\"]",
                    r"require\(['\"](\./[^'\"]+)['\"]\)",
                    r"require\(['\"](\.\./[^'\"]+)['\"]\)",
                ]
                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    imports.update(matches)
                    
            # Backend patterns (Python)
            elif file_path.suffix == '.py':
                # from .module import X
                # from ..module import X
                patterns = [
                    r"from\s+(\.+[\w\.]*)\s+import",
                    r"import\s+(\.+[\w\.]*)",
                ]
                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    imports.update(matches)
                    
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    
    return imports

def resolve_import_path(current_file: Path, import_path: str, root_dir: Path) -> Path:
    """Resolve relative import to absolute path"""
    current_dir = current_file.parent
    
    # Handle relative imports
    if import_path.startswith('./') or import_path.startswith('../'):
        resolved = (current_dir / import_path).resolve()
    else:
        # Handle absolute imports from root
        import_path = import_path.replace('.', os.sep)
        resolved = (root_dir / import_path).resolve()
    
    # Try different extensions if file doesn't exist
    extensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '']
    for ext in extensions:
        test_path = Path(str(resolved) + ext)
        if test_path.exists() and test_path.is_file():
            return test_path
            
        # Check for index files
        if resolved.is_dir():
            for index_name in ['index.js', 'index.jsx', 'index.ts', 'index.tsx', '__init__.py']:
                index_path = resolved / index_name
                if index_path.exists():
                    return index_path
                    
    return resolved

def find_unused_files(root_dir: str, entry_points: List[str], extensions: List[str]) -> Set[Path]:
    """Find all files that are not imported from entry points"""
    root_path = Path(root_dir)
    all_files = find_all_files(root_dir, extensions)
    
    used_files = set()
    to_process = [root_path / ep for ep in entry_points]
    
    # BFS to find all used files
    while to_process:
        current = to_process.pop(0)
        if not current.exists() or current in used_files:
            continue
            
        used_files.add(current)
        imports = extract_imports(current)
        
        for imp in imports:
            resolved = resolve_import_path(current, imp, root_path)
            if resolved.exists() and resolved not in used_files:
                to_process.append(resolved)
    
    # Files that exist but are never used
    unused = all_files - used_files
    return unused

def main():
    project_root = Path(__file__).parent
    
    print("=" * 80)
    print("FRONTEND UNUSED FILES")
    print("=" * 80)
    
    frontend_root = project_root / "frontend" / "src"
    frontend_entry = ["main.jsx"]
    frontend_extensions = ["js", "jsx", "ts", "tsx", "css"]
    
    frontend_unused = find_unused_files(
        str(frontend_root),
        frontend_entry,
        frontend_extensions
    )
    
    frontend_unused = sorted(frontend_unused, key=lambda x: str(x))
    for file in frontend_unused:
        rel_path = file.relative_to(frontend_root)
        print(f"  {rel_path}")
    
    print(f"\nTotal: {len(frontend_unused)} unused files\n")
    
    print("=" * 80)
    print("BACKEND UNUSED FILES")
    print("=" * 80)
    
    backend_root = project_root / "backend"
    backend_entry = ["main.py"]
    backend_extensions = ["py"]
    
    backend_unused = find_unused_files(
        str(backend_root),
        backend_entry,
        backend_extensions
    )
    
    backend_unused = sorted(backend_unused, key=lambda x: str(x))
    for file in backend_unused:
        try:
            rel_path = file.relative_to(backend_root)
            print(f"  {rel_path}")
        except:
            print(f"  {file}")
    
    print(f"\nTotal: {len(backend_unused)} unused files\n")
    
    # Save to file
    output_file = project_root / "unused_files.txt"
    with open(output_file, 'w') as f:
        f.write("FRONTEND UNUSED FILES\n")
        f.write("=" * 80 + "\n")
        for file in frontend_unused:
            rel_path = file.relative_to(frontend_root)
            f.write(f"{rel_path}\n")
        
        f.write("\n\nBACKEND UNUSED FILES\n")
        f.write("=" * 80 + "\n")
        for file in backend_unused:
            try:
                rel_path = file.relative_to(backend_root)
                f.write(f"{rel_path}\n")
            except:
                f.write(f"{file}\n")
    
    print(f"\nResults saved to: {output_file}")

if __name__ == "__main__":
    main()
