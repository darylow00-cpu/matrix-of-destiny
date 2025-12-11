# -*- coding: utf-8 -*-
import re
import json

# Читаем файл
with open('arakan.txt', 'r', encoding='utf-8') as f:
    content = f.read()

descriptions = {}

# Находим все блоки "Аркан + Сфера"
pattern = r'=== (\d+) АРКАН.*?===\s*\n### Сфера: (.*?) ###\s*\n([\s\S]*?)(?=\n=== \d+ АРКАН|$)'
matches = re.findall(pattern, content, re.MULTILINE)

for match in matches:
    arcana_number = match[0]
    sphere_header = match[1]
    sphere_content = match[2].strip()
    
    # Определяем тип сферы
    sphere_type = None
    if 'ЛИЧНЫЕ КАЧЕСТВА' in sphere_header or 'ХАРАКТЕР' in sphere_header:
        sphere_type = 'qualities'
    elif 'ПРОШЛАЯ ЖИЗНЬ' in sphere_header:
        sphere_type = 'pastlife'
    elif 'ТАЛАНТЫ' in sphere_header:
        sphere_type = 'talents'
    elif 'ПРЕДНАЗНАЧЕНИЕ' in sphere_header:
        sphere_type = 'purpose'
    elif 'ДЕНЬГИ' in sphere_header or 'БИЗНЕС' in sphere_header:
        sphere_type = 'money'
    elif 'ПРОГРАММЫ' in sphere_header:
        sphere_type = 'programs'
    elif 'СЕКСУАЛЬНОСТЬ' in sphere_header:
        sphere_type = 'sexuality'
    elif 'РОДИТЕЛИ' in sphere_header:
        sphere_type = 'parents'
    elif 'ДЕТИ' in sphere_header:
        sphere_type = 'children'
    elif 'ОТНОШЕНИЯ' in sphere_header:
        sphere_type = 'relationships'
    elif 'РУКОВОДСТВО' in sphere_header or 'УПРАВЛЕНИЕ' in sphere_header:
        sphere_type = 'leadership'
    elif 'ПРОГНОЗ НА ГОД' in sphere_header:
        sphere_type = 'year'
    elif 'ЛИЧНЫЙ БРЕНД' in sphere_header or 'ПОЗИЦИОНИРОВАНИЕ' in sphere_header:
        sphere_type = 'brand'
    elif 'ЗДОРОВЬЕ' in sphere_header:
        sphere_type = 'health'
    
    if not sphere_type:
        continue
    
    # Сохраняем
    if arcana_number not in descriptions:
        descriptions[arcana_number] = {}
    descriptions[arcana_number][sphere_type] = sphere_content

# Создаем JavaScript файл
js_content = "// Автоматически сгенерированный файл с расшифровками арканов\n"
js_content += "const arcanaDescriptionsData = " + json.dumps(descriptions, ensure_ascii=False, indent=2) + ";\n"

with open('src/arcana_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Готово! Обработано {len(descriptions)} арканов")
for arcana in sorted(descriptions.keys(), key=int):
    print(f"Аркан {arcana}: {len(descriptions[arcana])} сфер - {', '.join(descriptions[arcana].keys())}")
