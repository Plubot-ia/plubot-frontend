#!/usr/bin/env python3
"""
Script para generar una estructura de directorios condensada,
agrupando archivos similares y directorios de imágenes para mejor visualización.
"""

import os
import re
from collections import defaultdict, Counter

def add_note(line, notes):
    """Añade una nota al final de la línea si existe en el diccionario de notas"""
    for pattern, note in notes.items():
        if re.search(pattern, line):
            return f"{line} {note}"
    return line

def get_base_name(filename):
    """Extrae el nombre base del archivo sin la extensión"""
    return os.path.splitext(filename)[0]

def get_extension(filename):
    """Obtiene la extensión del archivo"""
    return os.path.splitext(filename)[1].lower()

def is_image_file(filename):
    """Determina si un archivo es una imagen basado en su extensión"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff'}
    return get_extension(filename) in image_extensions

def is_image_directory(files):
    """Determina si un directorio contiene principalmente imágenes"""
    if not files:
        return False
    
    image_count = sum(1 for f in files if is_image_file(f))
    return image_count / len(files) >= 0.5  # Si más del 50% son imágenes

def should_condense(files, threshold=10, is_img_dir=False):
    """
    Determina si un conjunto de archivos debe condensarse basado en patrones similares
    y aplica un umbral más bajo para directorios de imágenes
    """
    # Umbral más bajo para directorios de imágenes
    if is_img_dir:
        threshold = min(threshold, 5)  # Aplica un umbral más bajo para imágenes
    
    if len(files) < threshold:
        return False
    
    # Analizar patrones en los nombres de archivos
    extensions = Counter([get_extension(f) for f in files])
    
    # Buscar patrones comunes en nombres de archivos
    prefixes = Counter()
    for file in files:
        base = get_base_name(file)
        prefix = '-'.join(base.split('-')[:-1]) if '-' in base else base
        prefixes[prefix] += 1
    
    # Si hay muchos archivos con el mismo prefijo o extensión, condensar
    return any(count >= threshold/2 for count in extensions.values()) or \
           any(count >= threshold/2 for count in prefixes.values())

def generate_directory_tree(start_path='.', output_file='directory_structure.txt', exclude_dirs=None, notes=None, condensation_threshold=10):
    """
    Genera un archivo de texto con la estructura de directorios mejorada y condensada
    
    Args:
        start_path: Directorio inicial para comenzar la exploración
        output_file: Nombre del archivo donde se guardará la estructura
        exclude_dirs: Lista de directorios a excluir
        notes: Diccionario con patrones de archivos y notas a añadir
        condensation_threshold: Número mínimo de archivos para considerar condensación
    """
    if exclude_dirs is None:
        exclude_dirs = ['venv', '__pycache__', '.git', '.idea', 'node_modules', 'dist', 'build']
    
    if notes is None:
        notes = {}
    
    # Obtener el nombre del directorio raíz
    root_name = os.path.basename(os.path.abspath(start_path))
    
    # Estructura para almacenar el árbol de directorios
    tree = {}
    
    # Recopilar la estructura de directorios
    for root, dirs, files in os.walk(start_path):
        # Excluir directorios no deseados
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        # Ignorar el directorio raíz en la estructura relativa
        rel_path = os.path.relpath(root, start_path)
        
        # Excluir archivos ocultos y .DS_Store
        files = [f for f in files if not f.startswith('.') and f != '.DS_Store']
        
        # Determinar si es un directorio de imágenes
        is_img_dir = is_image_directory(files)
        
        # Agrupar archivos por nombre base (sin extensión)
        files_by_base = defaultdict(list)
        for file in files:
            base_name = get_base_name(file)
            files_by_base[base_name].append(file)
        
        # Almacenar en la estructura
        if rel_path == '.':
            tree[root_name] = {'dirs': {}, 'files': files_by_base, 'all_files': files, 'is_img_dir': is_img_dir}
        else:
            # Navegar por el árbol para encontrar el directorio correcto
            current = tree[root_name]
            parts = rel_path.split(os.sep)
            
            for part in parts:
                if part not in current['dirs']:
                    current['dirs'][part] = {'dirs': {}, 'files': {}, 'all_files': [], 'is_img_dir': False}
                current = current['dirs'][part]
            
            current['files'] = files_by_base
            current['all_files'] = files
            current['is_img_dir'] = is_img_dir
    
    # Escribir el árbol a un archivo
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"{root_name}/\n")
        write_tree(f, tree[root_name], '', notes, condensation_threshold)
    
    print(f"Estructura de directorios guardada en '{output_file}'")

def analyze_patterns(files):
    """Analiza patrones en los nombres de archivos para agruparlos mejor"""
    patterns = {}
    
    # Buscar patrones por extensión
    by_extension = defaultdict(list)
    for f in files:
        ext = get_extension(f)
        by_extension[ext].append(f)
    
    # Buscar patrones por prefijo común
    by_prefix = defaultdict(list)
    for f in files:
        base = get_base_name(f)
        prefix = '-'.join(base.split('-')[:-1]) if '-' in base else ''
        if prefix:
            by_prefix[prefix].append(f)
    
    # Determinar el mejor método para condensar
    if len(by_extension) < len(by_prefix) and any(len(files) > 3 for files in by_extension.values()):
        for ext, files_list in by_extension.items():
            if len(files_list) > 3:
                patterns[f"*{ext}"] = files_list
    elif any(len(files) > 3 for files in by_prefix.values()):
        for prefix, files_list in by_prefix.items():
            if len(files_list) > 3:
                patterns[f"{prefix}-*"] = files_list
    
    # Si todos los archivos son imágenes con la misma extensión, condensa todo el directorio
    if len(by_extension) == 1 and all(is_image_file(f) for f in files):
        ext = list(by_extension.keys())[0]
        patterns = {f"*{ext}": files}
    
    return patterns

def condense_image_directory(files):
    """Condensa un directorio de imágenes en un solo patrón"""
    extensions = Counter([get_extension(f) for f in files])
    most_common_ext = extensions.most_common(1)[0][0] if extensions else ""
    
    if most_common_ext:
        return {f"*{most_common_ext}": [f for f in files if f.endswith(most_common_ext)]}
    return {}

def write_tree(file, node, prefix, notes, condensation_threshold):
    """
    Escribe la estructura del árbol en el archivo
    con una visualización jerárquica correcta y condensada
    """
    # Ordenar directorios y archivos para una visualización consistente
    dirs = sorted(node['dirs'].keys())
    
    # Determinar si es un directorio de imágenes
    is_img_dir = node['is_img_dir']
    
    # Preparar la condensación
    all_files = node['all_files']
    condensed_patterns = {}
    
    # Aplicar diferentes estrategias según el tipo de directorio
    if is_img_dir:
        # Si es un directorio de imágenes, usar un umbral más bajo
        if should_condense(all_files, condensation_threshold, is_img_dir=True):
            condensed_patterns = condense_image_directory(all_files)
    elif should_condense(all_files, condensation_threshold):
        condensed_patterns = analyze_patterns(all_files)
    
    # Eliminar archivos ya condensados
    condensed_files = set()
    for pattern_files in condensed_patterns.values():
        condensed_files.update(pattern_files)
    
    # Actualizar los grupos de archivos - mantenemos esto como diccionario
    file_dict = {}
    for base, files in node['files'].items():
        remaining = [f for f in files if f not in condensed_files]
        if remaining:
            file_dict[base] = remaining
    
    # Usamos una lista ordenada de las claves del diccionario
    file_groups = sorted(file_dict.keys())
    
    total_items = len(dirs) + len(file_groups) + len(condensed_patterns)
    current_item = 0
    
    # Escribir directorios
    for idx, dir_name in enumerate(dirs):
        current_item += 1
        is_last = current_item == total_items
        
        if is_last and total_items > 0:
            file.write(f"{prefix}└── {dir_name}/\n")
            new_prefix = prefix + "    "
        else:
            file.write(f"{prefix}├── {dir_name}/\n")
            new_prefix = prefix + "│   "
        
        # Recursivamente escribir el contenido del directorio
        write_tree(file, node['dirs'][dir_name], new_prefix, notes, condensation_threshold)
    
    # Escribir patrones condensados
    for pattern, files in condensed_patterns.items():
        current_item += 1
        is_last = current_item == total_items
        
        count = len(files)
        if is_last:
            line = f"{prefix}└── {pattern} ({count} archivos)"
        else:
            line = f"{prefix}├── {pattern} ({count} archivos)"
        
        # Añadir nota si existe
        file.write(f"{line}\n")
    
    # Escribir grupos de archivos individuales - ahora usando correctamente el diccionario
    for base_name in file_groups:
        files = sorted(file_dict[base_name])  # Usamos file_dict en lugar de file_groups
            
        for file_idx, filename in enumerate(files):
            current_item += 1
            is_last_file = current_item == total_items
            
            if is_last_file:
                line = f"{prefix}└── {filename}"
            else:
                line = f"{prefix}├── {filename}"
            
            # Añadir nota si existe
            line_with_note = add_note(line, notes)
            file.write(f"{line_with_note}\n")

if __name__ == "__main__":
    # Define notas para archivos específicos
    file_notes = {
        r'App\.jsx$': '✅ Componente principal actualizado',
        r'index\.html$': '✅ SEO optimizado',
        r'SheetsViewer\.jsx$': '✅ NUEVO',
        r'useGoogleSheets\.js$': '✅ NUEVO — consumo de Google Sheets desde frontend',
        r'integrations\.py$': '✅ NUEVO — endpoints Google Sheets, Notion, Trello',
        # Añade más notas según sea necesario
    }
    
    # Directorios a excluir (incluyendo .DS_Store)
    exclude = ['node_modules', 'dist', 'build', '.next', '.cache', 'coverage', '.git', '__pycache__', '.DS_Store']
    
    # Generar estructura
    generate_directory_tree(
        start_path='.',
        output_file='estructura_frontend.txt',
        exclude_dirs=exclude,
        notes=file_notes,
        condensation_threshold=8  # Puedes ajustar este valor
    )