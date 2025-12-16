// Скрипт для управления блоками расшифровки совместимости

// Маппинг ID блоков на названия сфер в данных
const COMPATIBILITY_SPHERE_MAPPING = {
  'sphere-1': 'Фундамент отношений / базовая энергия пары',
  'sphere-2': 'Эмоциональная гармония / поддержка',
  'sphere-3': 'Сексуальная совместимость / интим',
  'sphere-4': 'Бытовая совместимость / домашний комфорт',
  'sphere-5': 'Финансовая гармония / ресурсы',
  'sphere-6': 'Социальная совместимость / статус',
  'sphere-7': 'Совместные цели и амбиции',
  'sphere-8': 'Мужская энергия / инициатива мужчины',
  'sphere-9': 'Женская энергия / эмоциональная поддержка женщины',
  'sphere-10': 'Сила союза / баланс ролей',
  'sphere-11': 'Кармическая суть / центр отношений',
  'sphere-12': 'Стабильность и долговечность',
  'sphere-13': 'Общие дела и проекты',
  'sphere-14': 'Привязанность и забота / эмоциональный союз'
};

// Функция для получения расшифровки аркана для конкретной сферы
function getCompatibilityDescription(arcanaNumber, sphereId) {
  console.log(`[compatibility.desc] Получение расшифровки для аркана ${arcanaNumber}, сфера ${sphereId}`);
  console.log('[compatibility.desc] COMPATIBILITY_TEXTS существует:', !!COMPATIBILITY_TEXTS);
  
  if (!COMPATIBILITY_TEXTS || !COMPATIBILITY_TEXTS[arcanaNumber]) {
    console.warn('[compatibility.desc] Аркан не найден:', arcanaNumber);
    console.log('[compatibility.desc] Доступные арканы:', Object.keys(COMPATIBILITY_TEXTS || {}));
    return null;
  }

  const sphereName = COMPATIBILITY_SPHERE_MAPPING[sphereId];
  if (!sphereName) {
    console.warn('[compatibility.desc] Неизвестный ID сферы:', sphereId);
    return null;
  }

  console.log(`[compatibility.desc] Поиск сферы "${sphereName}" в аркане ${arcanaNumber}`);
  const arcanaData = COMPATIBILITY_TEXTS[arcanaNumber];
  console.log('[compatibility.desc] Структура arcanaData:', Object.keys(arcanaData));
  
  const description = arcanaData.spheres[sphereName];
  
  if (!description) {
    console.warn('[compatibility.desc] Расшифровка не найдена для аркана', arcanaNumber, 'и сферы', sphereName);
    console.log('[compatibility.desc] Доступные сферы:', Object.keys(arcanaData.spheres || {}));
    return null;
  }

  console.log(`[compatibility.desc] Расшифровка найдена (${description.length} символов)`);
  return {
    title: arcanaData.title,
    text: description
  };
}

// Функция для форматирования текста расшифровки
function formatCompatibilityDescription(text, arcanaTitle) {
  if (!text) return '';
  
  // Разбиваем текст на абзацы
  const paragraphs = text.split('\n').filter(p => p.trim());
  
  // Формируем HTML с заголовком аркана и абзацами
  let html = `<h4 class="arcana-title">${arcanaTitle}</h4>`;
  html += paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
  
  return html;
}

// Функция для обновления содержимого блока совместимости
function updateCompatibilitySphereContent(sphereId, arcanaNumber) {
  console.log(`[compatibility.update] Обновление ${sphereId} с арканом ${arcanaNumber}`);
  
  const descriptionData = getCompatibilityDescription(arcanaNumber, sphereId);
  
  if (!descriptionData) {
    console.warn('[compatibility.update] Не удалось получить расшифровку для', sphereId, arcanaNumber);
    return;
  }

  // Находим контейнер sphere-item по ID сферы
  const sphereItem = document.getElementById(sphereId);
  if (!sphereItem) {
    console.warn('[compatibility.update] sphere-item не найден для', sphereId);
    return;
  }

  // Находим элемент с номером аркана внутри этого блока
  const arcanaElement = sphereItem.querySelector(`#${sphereId}-arcana`);
  if (arcanaElement) {
    arcanaElement.textContent = arcanaNumber;
    console.log(`[compatibility.update] Установлен номер аркана ${arcanaNumber} для ${sphereId}`);
  }

  // Находим блок с описанием внутри этого sphere-item
  const descriptionBlock = sphereItem.querySelector('.sphere-description');
  if (!descriptionBlock) {
    console.warn('[compatibility.update] Блок .sphere-description не найден в', sphereId);
    return;
  }

  // Обновляем содержимое
  const formattedText = formatCompatibilityDescription(descriptionData.text, descriptionData.title);
  descriptionBlock.innerHTML = formattedText;
  
  console.log('[compatibility.update] Блок успешно обновлён:', sphereId);
}

// Функция для заполнения всех блоков совместимости
function fillCompatibilitySpheres(compatibility) {
  if (!compatibility || !compatibility.points) {
    console.warn('[compatibility] Нет данных для заполнения');
    return;
  }

  console.log('[compatibility] Начало заполнения блоков совместимости');
  console.log('[compatibility] Доступные точки:', Object.keys(compatibility.points));
  console.log('[compatibility] Значение spoint:', compatibility.points.spoint);

  // Маппинг сфер совместимости на расчётные точки матрицы
  const sphereArcanaMapping = {
    'sphere-1': compatibility.points.apoint,          // Фундамент - точка A
    'sphere-2': compatibility.points.spoint,          // Эмоциональная гармония - точка S
    'sphere-3': compatibility.points.jpoint,          // Сексуальность - точка J (заблокировано)
    'sphere-4': compatibility.points.dpoint,          // Быт - точка D (заблокировано)
    'sphere-5': compatibility.points.cpoint,          // Финансы - точка C (заблокировано)
    'sphere-6': compatibility.points.bpoint,          // Социальность - точка B (заблокировано)
    'sphere-7': compatibility.points.mpoint,          // Амбиции - точка M (заблокировано)
    'sphere-8': compatibility.points.fpoint,          // Мужская энергия - точка F (заблокировано)
    'sphere-9': compatibility.points.gpoint,          // Женская энергия - точка G (заблокировано)
    'sphere-10': compatibility.points.union,          // Сила союза - Union (заблокировано)
    'sphere-11': compatibility.points.epoint,         // Кармическая суть - точка E (заблокировано)
    'sphere-12': compatibility.points.hpoint,         // Стабильность - точка H (заблокировано)
    'sphere-13': compatibility.points.npoint,         // Общие дела - точка N (заблокировано)
    'sphere-14': compatibility.points.vpoint          // Привязанность - точка V (заблокировано)
  };

  console.log('[compatibility] Маппинг сфер:', sphereArcanaMapping);

  // Список заблокированных сфер (все кроме первых двух)
  const lockedSpheres = ['sphere-3', 'sphere-4', 'sphere-5', 'sphere-6', 'sphere-7', 
                         'sphere-8', 'sphere-9', 'sphere-10', 'sphere-11', 'sphere-12',
                         'sphere-13', 'sphere-14'];

  // Заполняем каждый блок
  for (const [sphereId, arcanaNumber] of Object.entries(sphereArcanaMapping)) {
    console.log(`[compatibility] Обработка ${sphereId}, аркан: ${arcanaNumber}`);
    
    // Загружаем расшифровку только для незаблокированных сфер
    if (!lockedSpheres.includes(sphereId)) {
      console.log(`[compatibility] ${sphereId} не заблокирована, загружаем содержимое`);
      updateCompatibilitySphereContent(sphereId, arcanaNumber);
    } else {
      // Для заблокированных сфер только устанавливаем номер аркана
      console.log(`[compatibility] ${sphereId} заблокирована, только номер аркана`);
      const sphereItem = document.getElementById(sphereId);
      if (sphereItem) {
        const arcanaElement = sphereItem.querySelector(`#${sphereId}-arcana`);
        if (arcanaElement) {
          arcanaElement.textContent = arcanaNumber;
        }
      }
    }
  }
  
  // После заполнения всех блоков инициализируем аккордеон
  console.log('[compatibility] Инициализация аккордеона после заполнения');
  initializeCompatibilityAccordion();
}

// Функция для инициализации аккордеона
function initializeCompatibilityAccordion() {
  const compatibilitySpheres = document.querySelectorAll('#sphere-1, #sphere-2, #sphere-3, #sphere-4, #sphere-5, #sphere-6, #sphere-7, #sphere-8, #sphere-9, #sphere-10, #sphere-11, #sphere-12, #sphere-13, #sphere-14');
  
  if (compatibilitySpheres.length === 0) {
    console.log('[compatibility.accordion] Блоки совместимости не найдены');
    return;
  }

  console.log('[compatibility.accordion] Инициализация аккордеона для', compatibilitySpheres.length, 'блоков');
  
  compatibilitySpheres.forEach(item => {
    const header = item.querySelector('.sphere-header');
    
    if (!header) {
      console.warn('[compatibility.accordion] Заголовок не найден для блока', item.id);
      return;
    }
    
    // Удаляем старые обработчики клика если они есть
    header.removeEventListener('click', handleSphereHeaderClick);
    // Добавляем новый обработчик
    header.addEventListener('click', handleSphereHeaderClick);
  });
  
  console.log('[compatibility.accordion] Аккордеон инициализирован');
}

// Обработчик клика на заголовок сферы
function handleSphereHeaderClick(event) {
  const header = this;
  const item = header.closest('.sphere-item');
  
  if (!item) return;
  
  // Проверяем, заблокирован ли блок
  if (item.classList.contains('locked')) {
    // Прокручиваем к кнопке для покупки полного чтения
    const purchaseBtn = document.getElementById('decode-matrix-btn');
    if (purchaseBtn) {
      purchaseBtn.scrollIntoView({behavior: 'smooth', block: 'center'});
      console.log('[compatibility.accordion] Прокрутка к кнопке покупки для', item.id);
    }
    return;
  }
  
  // Проверяем, был ли блок уже открыт
  const wasActive = item.classList.contains('active');
  
  // Закрываем все блоки
  const allSpheres = document.querySelectorAll('#sphere-1, #sphere-2, #sphere-3, #sphere-4, #sphere-5, #sphere-6, #sphere-7, #sphere-8, #sphere-9, #sphere-10, #sphere-11, #sphere-12, #sphere-13, #sphere-14');
  allSpheres.forEach(otherItem => {
    otherItem.classList.remove('active');
  });
  
  // Если блок не был активен, открываем его
  if (!wasActive) {
    item.classList.add('active');
    
    // Плавная прокрутка к началу открытого блока
    setTimeout(() => {
      item.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 100);
    
    console.log('[compatibility.accordion] Открыт блок', item.id);
  } else {
    console.log('[compatibility.accordion] Закрыт блок', item.id);
  }
}
