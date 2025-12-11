// Функция для расчета аркана прогноза на год на основе возраста
function getYearForecastArcana(birthDate, person) {
  if (!birthDate || !person || !person.years) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  // Вычисляем точный возраст с учетом месяцев и дней
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  
  // Корректируем возраст, если день рождения еще не наступил
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  
  // Точный возраст с десятичной частью
  const monthsIntoYear = monthDiff >= 0 ? monthDiff : 12 + monthDiff;
  const daysIntoMonth = dayDiff >= 0 ? dayDiff : new Date(today.getFullYear(), today.getMonth(), 0).getDate() + dayDiff;
  const preciseAge = age + monthsIntoYear / 12 + daysIntoMonth / 365;
  
  console.log('[year forecast] birthDate:', birthDate, 'age:', age, 'preciseAge:', preciseAge.toFixed(2));
  
  // Цикл повторяется каждые 80 лет
  const cycleAge = preciseAge % 80;
  
  // Карта возраста к ключу в объекте person.years (по 1.5 года)
  // Основано на разметке HTML с возрастами и соответствующими арканами
  const ageToYearKey = [
    { min: 0, max: 1.5, key: 'afpoint' },       // 0-1.5
    { min: 1, max: 2.5, key: 'af2point' },      // 1-2.5
    { min: 2.5, max: 3.5, key: 'af1point' },    // 2.5-3.5  
    { min: 3.5, max: 4, key: 'af3point' },      // 3.5-4
    { min: 4, max: 5.5, key: 'af4point' },      // 4-5.5
    { min: 6, max: 7.5, key: 'af5point' },      // 6-7.5
    { min: 7.5, max: 8.5, key: 'af4point' },    // 7.5-8.5
    { min: 8.5, max: 9, key: 'af6point' },      // 8.5-9
    { min: 9, max: 10.5, key: 'fbpoint' },      // 9-10.5
    { min: 11, max: 12.5, key: 'fb2point' },    // 11-12.5
    { min: 12.5, max: 13.5, key: 'fb1point' },  // 12.5-13.5
    { min: 13.5, max: 14, key: 'fb3point' },    // 13.5-14
    { min: 14, max: 15.5, key: 'fb4point' },    // 14-15.5
    { min: 16, max: 17.5, key: 'fb5point' },    // 16-17.5
    { min: 17.5, max: 18.5, key: 'fb4point' },  // 17.5-18.5
    { min: 18.5, max: 19, key: 'fb6point' },    // 18.5-19
    { min: 19, max: 20.5, key: 'bgpoint' },     // 19-20.5
    { min: 21, max: 22.5, key: 'bg2point' },    // 21-22.5
    { min: 22.5, max: 23.5, key: 'bg1point' },  // 22.5-23.5
    { min: 23.5, max: 24, key: 'bg3point' },    // 23.5-24
    { min: 24, max: 25.5, key: 'bg4point' },    // 24-25.5
    { min: 26, max: 27.5, key: 'bg5point' },    // 26-27.5
    { min: 27.5, max: 28.5, key: 'bg4point' },  // 27.5-28.5
    { min: 28.5, max: 29, key: 'bg6point' },    // 28.5-29
    { min: 29, max: 30.5, key: 'gcpoint' },     // 29-30.5
    { min: 31, max: 32.5, key: 'gc2point' },    // 31-32.5
    { min: 32.5, max: 33.5, key: 'gc1point' },  // 32.5-33.5
    { min: 33.5, max: 34, key: 'gc3point' },    // 33.5-34
    { min: 34, max: 35.5, key: 'gc4point' },    // 34-35.5
    { min: 36, max: 37.5, key: 'gc5point' },    // 36-37.5
    { min: 37.5, max: 38.5, key: 'gc4point' },  // 37.5-38.5
    { min: 38.5, max: 39, key: 'gc6point' },    // 38.5-39
    { min: 39, max: 40.5, key: 'cipoint' },     // 39-40.5
    { min: 41, max: 42.5, key: 'ci2point' },    // 41-42.5
    { min: 42.5, max: 43.5, key: 'ci1point' },  // 42.5-43.5
    { min: 43.5, max: 44, key: 'ci3point' },    // 43.5-44
    { min: 44, max: 45.5, key: 'ci4point' },    // 44-45.5
    { min: 46, max: 47.5, key: 'ci5point' },    // 46-47.5
    { min: 47.5, max: 48.5, key: 'ci4point' },  // 47.5-48.5
    { min: 48.5, max: 49, key: 'ci6point' },    // 48.5-49
    { min: 49, max: 50.5, key: 'idpoint' },     // 49-50.5
    { min: 51, max: 52.5, key: 'id2point' },    // 51-52.5
    { min: 52.5, max: 53.5, key: 'id1point' },  // 52.5-53.5
    { min: 53.5, max: 54, key: 'id3point' },    // 53.5-54
    { min: 54, max: 55.5, key: 'id4point' },    // 54-55.5
    { min: 56, max: 57.5, key: 'id5point' },    // 56-57.5
    { min: 57.5, max: 58.5, key: 'id4point' },  // 57.5-58.5
    { min: 58.5, max: 59, key: 'id6point' },    // 58.5-59
    { min: 59, max: 60.5, key: 'dhpoint' },     // 59-60.5
    { min: 61, max: 62.5, key: 'dh2point' },    // 61-62.5
    { min: 62.5, max: 63.5, key: 'dh1point' },  // 62.5-63.5
    { min: 63.5, max: 64, key: 'dh3point' },    // 63.5-64
    { min: 64, max: 65.5, key: 'dh4point' },    // 64-65.5
    { min: 66, max: 67.5, key: 'dh5point' },    // 66-67.5
    { min: 67.5, max: 68.5, key: 'dh4point' },  // 67.5-68.5
    { min: 68.5, max: 69, key: 'dh6point' },    // 68.5-69
    { min: 69, max: 70.5, key: 'hapoint' },     // 69-70.5
    { min: 71, max: 72.5, key: 'ha2point' },    // 71-72.5
    { min: 72.5, max: 73.5, key: 'ha1point' },  // 72.5-73.5
    { min: 73.5, max: 74, key: 'ha3point' },    // 73.5-74
    { min: 74, max: 75.5, key: 'ha4point' },    // 74-75.5
    { min: 76, max: 77.5, key: 'ha5point' },    // 76-77.5
    { min: 77.5, max: 78.5, key: 'ha4point' },  // 77.5-78.5
    { min: 78.5, max: 79, key: 'ha6point' },    // 78.5-79
    { min: 79, max: 80, key: 'afpoint' }        // 79-80 → начало цикла
  ];
  
  // Найти соответствующий ключ для текущего возраста
  const period = ageToYearKey.find(p => cycleAge >= p.min && cycleAge < p.max);
  
  if (period) {
    const arcana = person.years[period.key];
    console.log('[year forecast] found period:', period, 'arcana:', arcana);
    return arcana;
  }
  
  console.warn('[year forecast] no period found for age:', cycleAge);
  return null;
}

// Функция для заполнения значений арканов в блоках расшифровки сфер
function fillSphereArcanas(person, birthDate) {
  if (!person || !person.points) return;
  console.log('[spheres] fillSphereArcanas start', { points: person.points });
  
  // Получаем аркан прогноза на год на основе возраста
  const yearForecastArcana = birthDate ? getYearForecastArcana(birthDate, person) : person.points.vpoint;
  
  // Маппинг сфер на их арканы и ID
  const sphereMapping = {
    'qualities': person.points.apoint,      // Личные Качества
    'pastlife': person.points.cpoint,       // Прошлая жизнь
    'talents': person.points.epoint,        // Таланты (заблокировано)
    'purpose': person.purposes.perspurpose, // Предназначение (заблокировано)
    'money': person.points.fpoint,          // Деньги (заблокировано)
    'programs': person.points.dpoint,       // Программы (заблокировано)
    'sexuality': person.points.upoint,      // Сексуальность (заблокировано)
    'parents': person.points.gpoint,        // Родители (заблокировано)
    'children': person.points.jpoint,       // Дети (заблокировано)
    'relationships': person.points.wpoint,  // Отношения (заблокировано)
    'leadership': person.purposes.socialpurpose, // Руководство (заблокировано)
    'year': yearForecastArcana,             // Прогнозы на год (заблокировано)
    'brand': person.points.spoint,          // Личный бренд (заблокировано)
    'health': person.points.hpoint          // Здоровье (заблокировано)
  };
  
  // Список заблокированных сфер (все кроме первых двух)
  const lockedSpheres = ['talents', 'purpose', 'money', 'programs', 'sexuality', 
                         'parents', 'children', 'relationships', 'leadership', 
                         'year', 'brand', 'health'];
  
  // Заполняем номера арканов и расшифровки
  for (const [sphereId, arcanaNumber] of Object.entries(sphereMapping)) {
    // Устанавливаем номер аркана
    const arcanaElement = document.getElementById(`sphere-${sphereId}`);
    if (arcanaElement) {
      arcanaElement.textContent = arcanaNumber;
      console.log(`[spheres] set arcana number`, { sphereId, domId: `sphere-${sphereId}`, arcanaNumber });
    }
    
    // Загружаем расшифровку только для незаблокированных сфер
    if (!lockedSpheres.includes(sphereId)) {
      if (typeof ARKANA_TEXTS !== 'undefined' && typeof updateSphereContent === 'function') {
        console.log('[spheres] calling updateSphereContent', { sphereId, domId: `sphere-${sphereId}`, arcanaNumber });
        updateSphereContent(`sphere-${sphereId}`, arcanaNumber);
      }
    } else {
      console.log('[spheres] sphere is locked, skipping content load', { sphereId });
    }
  }
}

// Инициализация интерактивности блоков при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  const sphereItems = document.querySelectorAll('.sphere-item');
  
  sphereItems.forEach(item => {
    const header = item.querySelector('.sphere-header');
    
    header.addEventListener('click', function() {
      // Проверяем, заблокирован ли блок
      if (item.classList.contains('locked')) {
        // Прокручиваем к кнопке для покупки полного чтения
        const purchaseBtn = document.getElementById('decode-matrix-btn');
        if (purchaseBtn) {
          purchaseBtn.scrollIntoView({behavior: 'smooth', block: 'center'});
          console.log('[spheres] Прокрутка к кнопке покупки для заблокированного блока');
        }
        return;
      }
      
      // Проверяем, был ли блок уже открыт
      const wasActive = item.classList.contains('active');
      
      // Закрываем все блоки
      sphereItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });
      
      // Если блок не был активен, открываем его
      if (!wasActive) {
        item.classList.add('active');
        
        // Плавная прокрутка к началу открытого блока
        setTimeout(() => {
          item.scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 100);
      }
    });
  });
});
