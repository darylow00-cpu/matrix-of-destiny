# -*- coding: utf-8 -*-
import re
import json

# Читаем файл
with open('arakan.txt', 'r', encoding='utf-8') as f:
    text = f.read()

descriptions = {}

# Разбиваем на блоки
blocks = re.split(r'(?=^=== \d+ АРКАН)', text, flags=re.MULTILINE)

for block in blocks:
    if not block.strip():
        continue
    
    # Находим номер аркана
    arcana_match = re.search(r'^=== (\d+) АРКАН', block, re.MULTILINE)
    if not arcana_match:
        continue
    
    arcana_number = arcana_match.group(1)
    
    # Находим заголовок сферы
    sphere_match = re.search(r'### Сфера: (.*?) ###', block)
    if not sphere_match:
        continue
    
    sphere_header = sphere_match.group(1)
    
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
    
    # Извлекаем текст после заголовка сферы
    content_match = re.search(r'### Сфера:.*?###\s*\n([\s\S]*?)$', block)
    content = content_match.group(1).strip() if content_match else ''
    
    # Сохраняем
    if arcana_number not in descriptions:
        descriptions[arcana_number] = {}
    descriptions[arcana_number][sphere_type] = content

# Создаем JavaScript файл
js_content = "// Автоматически сгенерированный файл с расшифровками арканов\n"
js_content += "const arcanaDescriptionsData = " + json.dumps(descriptions, ensure_ascii=False, indent=2) + ";\n"

with open('src/arcana_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Готово! Обработано {len(descriptions)} арканов")
for arcana, spheres in descriptions.items():
    print(f"Аркан {arcana}: {len(spheres)} сфер")
