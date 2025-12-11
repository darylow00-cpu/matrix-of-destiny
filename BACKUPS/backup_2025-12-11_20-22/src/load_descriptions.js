// load_descriptions.js - Модуль для загрузки и отображения расшифровок арканов
// Использует глобальную переменную ARKANA_TEXTS из arkana_texts.js

/**
 * Обновляет содержимое блока сферы расшифровкой из данных
 * @param {string} sphereId - ID блока сферы (например, 'sphere-qualities')
 * @param {number} arcanaNumber - Номер аркана (от 1 до 22)
 */
function updateSphereContent(sphereId, arcanaNumber) {
    console.log('[descriptions] updateSphereContent', { sphereId, arcanaNumber });
    const arcanaSpan = document.getElementById(sphereId);
    if (!arcanaSpan) {
        console.warn('[descriptions] arcana span not found', { sphereId });
        return;
    }
    // Находим контейнер блока сферы и его контент
    const sphereItem = arcanaSpan.closest('.sphere-item');
    if (!sphereItem) {
        console.warn('[descriptions] sphere item not found via closest', { sphereId });
        return;
    }
    const content = sphereItem.querySelector('.sphere-content');
    if (!content) return;
    
    // Определяем тип сферы по ID
    const sphereType = getSphereTypeFromId(sphereId);
    
    // Получаем текст расшифровки
    const descriptionText = getArcanaDescription(arcanaNumber, sphereType);
    console.log('[descriptions] resolved sphereType', { sphereId, sphereType, hasText: !!descriptionText });

    // Получаем заголовок аркана, чтобы добавить его в начало описания
    const arcanaData = (typeof ARKANA_TEXTS !== 'undefined') ? ARKANA_TEXTS[arcanaNumber.toString()] : null;
    const arcanaTitle = arcanaData && arcanaData.title ? arcanaData.title : `Аркан ${arcanaNumber}`;
    
    if (descriptionText) {
        content.innerHTML = formatDescription(descriptionText, arcanaTitle);
    } else {
        content.innerHTML = '<p class="no-data">Данные для этой сферы пока недоступны</p>';
    }
}

/**
 * Ключевые слова для поиска соответствий между нашими сферами и названиями из данных
 */
const SPHERE_KEYWORDS = {
    'qualities': ['ЛИЧНЫЕ КАЧЕСТВА', 'ХАРАКТЕР', 'ПСИХОЛОГИЧЕСКИЙ ПОРТРЕТ', 'ЭНЕРГЕТИКА'],
    'pastlife': ['ПРОШЛАЯ ЖИЗНЬ', 'КАРМИЧЕСКАЯ ПАМЯТЬ'],
    'talents': ['ТАЛАНТЫ', 'ЗОЛОТОЙ ЗАПАС', 'СУПЕРСИЛЫ'],
    'purpose': ['ПРЕДНАЗНАЧЕНИЕ', 'МИССИЯ ДУШИ'],
    'money': ['ДЕНЬГИ', 'БИЗНЕС', 'КАРЬЕРА', 'ФИНАНСЫ'],
    'programs': ['ПРОГРАММЫ', 'КАРМИЧЕСКИЕ СЦЕНАРИИ', 'ЛОВУШКИ'],
    'sexuality': ['СЕКСУАЛЬНОСТЬ', 'ТЕМПЕРАМЕНТ', 'ЛЮБОВЬ'],
    'parents': ['РОДИТЕЛИ', 'ДЕТСКО-РОДИТЕЛЬСКАЯ', 'СЕПАРАЦИЯ'],
    'children': ['ДЕТИ', 'РОДИТЕЛЬ'],
    'relationships': ['ОТНОШЕНИЯ', 'ЛЮБОВЬ', 'ПАРТНЕР'],
    'leadership': ['РУКОВОДСТВО', 'УПРАВЛЕНИЕ', 'ЛИДЕРСТВО'],
    'year': ['ГОД', 'ПРОГНОЗ', 'ЭНЕРГИЯ ПЕРИОДА'],
    'brand': ['БРЕНД', 'ПОЗИЦИОНИРОВАНИЕ', 'ЛИЧНЫЙ БРЕНД'],
    'health': ['ЗДОРОВЬЕ', 'ПСИХОСОМАТИКА']
};

/**
 * Находит название сферы в данных по ключевым словам
 * @param {string} sphereType - Наш тип сферы
 * @param {object} spheres - Объект со сферами из данных
 * @returns {string|null} - Точное название сферы из данных или null
 */
function findSphereByKeywords(sphereType, spheres) {
    const keywords = SPHERE_KEYWORDS[sphereType];
    if (!keywords) return null;
    
    // Получаем все названия сфер из данных
    const sphereNames = Object.keys(spheres);
    
    // Ищем совпадение по ключевым словам
    for (const sphereName of sphereNames) {
        const upperSphereName = sphereName.toUpperCase();
        
        // Проверяем, содержится ли хотя бы одно ключевое слово
        const hasMatch = keywords.some(keyword => 
            upperSphereName.includes(keyword.toUpperCase())
        );
        
        if (hasMatch) {
            return sphereName;
        }
    }
    
    return null;
}

/**
 * Преобразует ID сферы в тип для поиска в данных
 * @param {string} sphereId - ID блока (sphere-qualities, sphere-pastlife и т.д.)
 * @returns {string} - Тип сферы для данных
 */
function getSphereTypeFromId(sphereId) {
    const mapping = {
        'sphere-qualities': 'qualities',
        'sphere-pastlife': 'pastlife',
        'sphere-talents': 'talents',
        'sphere-purpose': 'purpose',
        'sphere-money': 'money',
        'sphere-programs': 'programs',
        'sphere-sexuality': 'sexuality',
        'sphere-parents': 'parents',
        'sphere-children': 'children',
        'sphere-relationships': 'relationships',
        'sphere-leadership': 'leadership',
        'sphere-year': 'year',
        'sphere-brand': 'brand',
        'sphere-health': 'health'
    };
    
    return mapping[sphereId] || 'unknown';
}

/**
 * Получает текст расшифровки из данных
 * @param {number} arcanaNumber - Номер аркана
 * @param {string} sphereType - Тип сферы
 * @returns {string|null} - Текст расшифровки или null
 */
function getArcanaDescription(arcanaNumber, sphereType) {
    // Проверяем наличие глобальной переменной ARKANA_TEXTS
    if (typeof ARKANA_TEXTS === 'undefined') {
        console.error('ARKANA_TEXTS не загружен. Проверьте подключение arkana_texts.js');
        return null;
    }
    
    // Проверяем наличие данных для аркана
    const arcanaData = ARKANA_TEXTS[arcanaNumber.toString()];
    if (!arcanaData) {
        console.warn(`Нет данных для аркана ${arcanaNumber}`);
        return null;
    }
    
    // Проверяем наличие сфер
    if (!arcanaData.spheres) {
        console.warn(`Нет данных о сферах для аркана ${arcanaNumber}`);
        return null;
    }
    
    // Ищем сферу по ключевым словам
    const sphereName = findSphereByKeywords(sphereType, arcanaData.spheres);
    
    if (!sphereName) {
        console.warn(`Не найдена сфера для типа "${sphereType}" в аркане ${arcanaNumber}`);
        console.log('Доступные сферы:', Object.keys(arcanaData.spheres));
        return null;
    }
    
    const description = arcanaData.spheres[sphereName];
    if (!description) {
        console.warn(`Пустое описание для сферы "${sphereName}" аркана ${arcanaNumber}`);
        return null;
    }
    
    return description;
}

/**
 * Форматирует текст расшифровки для отображения
 * @param {string} text - Исходный текст
 * @returns {string} - Отформатированный HTML
 */
function formatDescription(text, arcanaTitle) {
    if (!text) return '';
    // Удаляем внутренние заголовки вида === 22 АРКАН — ШУТ (СВОБОДА) ===
    const cleaned = text
        .split('\n')
        .filter(line => !/^\s*={2,}.*АРКАН.*={2,}\s*$/i.test(line))
        .join('\n');

    // Разбиваем на параграфы (по двойным переносам строк)
    let formatted = cleaned
        .split('\n\n')
        .map(para => `<p>${para.trim()}</p>`)
        .join('');
    
    // Заменяем одинарные переносы внутри параграфов на <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Выделяем заголовки (строки, начинающиеся с цифр и точки или эмодзи)
    formatted = formatted.replace(/<p>([🔥💰🌟🛑🚀💼💎📱🎨🗣⚠️🏁🎯🌊❄️🔗❤️🌫🤱👶👑💔🛠📢👹🤝🕸🎭\d]+\.?\s*[^<]+?):/g, '<p><strong>$1:</strong>');

    // Добавляем заголовок аркана в начало
    const titleLine = `<p><strong>${arcanaTitle}</strong></p>`;
    return `${titleLine}${formatted}`;
}
