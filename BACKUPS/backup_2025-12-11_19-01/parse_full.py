# -*- coding: utf-8 -*-
import re
import json

print("Начинаем парсинг файла arakan.txt...")

# Читаем файл
with open('arakan.txt', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Размер файла: {len(content)} символов")

descriptions = {}

# Находим все блоки "=== N АРКАН ... ==="
arcana_blocks = re.split(r'(?=^=== \d+ АРКАН)', content, flags=re.MULTILINE)

print(f"Найдено блоков арканов: {len(arcana_blocks)}")

for block in arcana_blocks:
    if not block.strip():
        continue
    
    # Находим номер аркана в начале блока
    arcana_match = re.search(r'^=== (\d+) АРКАН', block, re.MULTILINE)
    if not arcana_match:
        continue
    
    arcana_number = arcana_match.group(1)
    
    if arcana_number not in descriptions:
        descriptions[arcana_number] = {}
    
    # Находим все блоки сфер в этом блоке аркана
    sphere_pattern = r'### Сфера: (.*?) ###\s*\n(.*?)(?=\n=== \d+ АРКАН|\n### Сфера:|$)'
    sphere_matches = re.findall(sphere_pattern, block, re.MULTILINE | re.DOTALL)
    
    for sphere_header, sphere_content in sphere_matches:
        sphere_content = sphere_content.strip()
        
        # Определяем тип сферы
        sphere_type = None
        sphere_header_upper = sphere_header.upper()
        
        if 'ЛИЧНЫЕ КАЧЕСТВА' in sphere_header_upper or 'ХАРАКТЕР' in sphere_header_upper:
            sphere_type = 'qualities'
        elif 'ПРОШЛАЯ ЖИЗНЬ' in sphere_header_upper:
            sphere_type = 'pastlife'
        elif 'ТАЛАНТЫ' in sphere_header_upper:
            sphere_type = 'talents'
        elif 'ПРЕДНАЗНАЧЕНИЕ' in sphere_header_upper:
            sphere_type = 'purpose'
        elif 'ДЕНЬГИ' in sphere_header_upper or 'БИЗНЕС' in sphere_header_upper:
            sphere_type = 'money'
        elif 'ПРОГРАММЫ' in sphere_header_upper:
            sphere_type = 'programs'
        elif 'СЕКСУАЛЬНОСТЬ' in sphere_header_upper:
            sphere_type = 'sexuality'
        elif 'РОДИТЕЛИ' in sphere_header_upper:
            sphere_type = 'parents'
        elif 'ДЕТИ' in sphere_header_upper:
            sphere_type = 'children'
        elif 'ОТНОШЕНИЯ' in sphere_header_upper:
            sphere_type = 'relationships'
        elif 'РУКОВОДСТВО' in sphere_header_upper or 'УПРАВЛЕНИЕ' in sphere_header_upper:
            sphere_type = 'leadership'
        elif 'ПРОГНОЗ НА ГОД' in sphere_header_upper:
            sphere_type = 'year'
        elif 'ЛИЧНЫЙ БРЕНД' in sphere_header_upper or 'ПОЗИЦИОНИРОВАНИЕ' in sphere_header_upper:
            sphere_type = 'brand'
        elif 'ЗДОРОВЬЕ' in sphere_header_upper:
            sphere_type = 'health'
        
        if sphere_type and sphere_content:
            descriptions[arcana_number][sphere_type] = sphere_content
            print(f"  Аркан {arcana_number}, сфера {sphere_type}: {len(sphere_content)} символов")

# Создаем JavaScript файл
js_content = "// Автоматически сгенерированный файл с расшифровками арканов\n"
js_content += "const arcanaDescriptionsData = " + json.dumps(descriptions, ensure_ascii=False, indent=2) + ";\n"

with open('src/arcana_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\n✅ Готово! Обработано {len(descriptions)} арканов")
print(f"Размер выходного файла: {len(js_content)} символов")
print("\nСтатистика по арканам:")
for arcana in sorted(descriptions.keys(), key=int):
    spheres = descriptions[arcana]
    print(f"Аркан {arcana}: {len(spheres)} сфер - {', '.join(sorted(spheres.keys()))}")
