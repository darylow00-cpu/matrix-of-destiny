#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

file_path = 'compatibility.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Заменяем все старые оверлеи на новые
old_pattern = '<div class="lock-icon">🔒</div>\s*<div class="locked-text">Платный раздел</div>\s*<div class="locked-description">Расшифровка доступна после оплаты полной версии</div>'
new_overlay = '''<div class="lock-premium-icon">✨</div>
                      <div class="locked-premium-text">Premium</div>
                      <div class="locked-premium-subtext">Разблокировать</div>'''

content = re.sub(old_pattern, new_overlay, content, flags=re.MULTILINE | re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Замена в compatibility.html завершена!')
