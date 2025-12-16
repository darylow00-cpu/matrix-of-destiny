const dateInput = document.getElementById("date");
const nameInput = document.getElementById("name");

console.log('[SCRIPT_PERSON] Script loaded');

const container = document.querySelector('.matrix-container');
if (!container) {
  console.error('Container .matrix-container not found');
} else {
  container.classList.add('display-none');
}

const btnAnswer = document.getElementById('get_the_answer');
if (!btnAnswer) {
  console.error('Button #get_the_answer not found');
} else {
  console.log('[SCRIPT_PERSON] Button found, attaching listener');
}

// Проверяем наличие необходимых функций из code.js
if (typeof reduceNumber === 'undefined') {
  console.error('reduceNumber function not found - code.js may not be loaded');
}
if (typeof calculatePoints === 'undefined') {
  console.error('calculatePoints function not found - code.js may not be loaded');
}

// ставит ограничитель в календаре на даты, которые не наступили
let today = new Date();
document.getElementById('date').setAttribute("max", today.toLocaleDateString("en-CA"));
// ставит ограничитель в календаре на даты, которые были раньше 120 лет назад
let ancientDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDay());
document.getElementById('date').setAttribute("min", ancientDate.toLocaleDateString("en-CA"));

// значение инпутов по умолчанию для перезагрузки страницы, пока выдает ошибку
dateInput.value = '';
nameInput.value = '';

let person = {};
let points = {};
let purposes = {};
let chartHeart = {};
let years = {};

//одна универсальная функция для каждой персоны
function createPerson(per, apoint, bpoint, cpoint) {
  calculatePoints(apoint, bpoint, cpoint);
  per.points = points;
  per.purposes = purposes;
  per.chartHeart = chartHeart;
  per.years = years;
}

function titleCase(str) {
  return str.replace(/^[a-zа-яё]|[\- ][a-zа-яё]/g, function (a) { return a.toUpperCase(); })
}

btnAnswer.addEventListener('click', (evt) => {
  try {
    evt.preventDefault();
    
    console.log('[DEBUG] Button clicked');
    
    // OVERFLOW DEBUG
    setTimeout(() => {
      const vw = window.innerWidth;
      const dw = document.documentElement.scrollWidth;
      const bw = document.body.scrollWidth;
      const overflow = Math.max(dw, bw) - vw;
      
      let msg = `📱 AFTER BUTTON CLICK\nViewport: ${vw}px\nDoc: ${dw}px\nBody: ${bw}px\nOVERFLOW: ${overflow}px\n\n`;
      
      const bad = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1) {
          bad.push({tag: el.tagName, id: el.id, cls: el.className.split(' ')[0], w: r.width, over: r.right - vw});
        }
      });
      bad.sort((a,b) => b.over - a.over);
      
      if (bad.length > 0) {
        msg += `TOP OVERFLOWING ELEMENTS:\n`;
        bad.slice(0, 5).forEach((item, i) => {
          msg += `${i+1}. ${item.tag}`;
          if (item.id) msg += ` ID:${item.id}`;
          if (item.cls) msg += ` CLASS:${item.cls}`;
          msg += `\n   +${Math.round(item.over)}px overflow\n`;
        });
      } else {
        msg += `NO OVERFLOW ELEMENTS`;
      }
      
      alert(msg);
      console.log(msg);
    }, 100);

    const date = new Date(document.getElementById('date').value);
    const calculationDate = document.getElementById('date').value;
    const name = document.getElementById('name').value;
    
    console.log('[DEBUG] Input values:', { calculationDate, name, date });
    
    // Проверяем, совпадает ли текущая матрица с оплаченной
    if (typeof PaymentService !== 'undefined' && PaymentService.resetPremiumIfKeyMismatch) {
      PaymentService.resetPremiumIfKeyMismatch();
    }
    
    const errorOutput = document.querySelector('.errorOutput');
    const output = document.querySelector('.output-personal-date');
    const response = valide(date, name);

    console.log('[DEBUG] Validation response:', response);

    output.innerHTML = '';
    errorOutput.innerHTML = '';

    const splitDate = calculationDate.split('-');
    const fullDate = `${splitDate[2]}.${splitDate[1]}.${splitDate[0]}`

    if (response !== true) {
      console.log('[DEBUG] Validation failed');
      output.innerHTML = '';
      errorOutput.innerHTML = response;
      container.classList.add('display-none');
    } else {
      console.log('[DEBUG] Validation passed, calculating...');
      
      output.innerHTML = titleCase(name) + ' ' + '<span class="gray">Дата рождения:</span>' + ' ' + fullDate;

      container.classList.remove('display-none');
      
      let apoint = reduceNumber(+splitDate[2]); // day of birth
      let bpoint = +splitDate[1]; // month of birth
      let year = +splitDate[0]; //year of birth
      let cpoint = calculateYear(year); // c - year of birth

      console.log('[DEBUG] Calculated points:', { apoint, bpoint, cpoint });

      createPerson(person, apoint, bpoint, cpoint);
      Points(person);
      ChartHeart();
      Purposes();
      fillSphereArcanas(person, calculationDate);
      outputYears(person.years);
      
      const sphereExplanations = document.querySelector('.sphere-explanations');
      if (sphereExplanations) {
        sphereExplanations.classList.remove('display-none');
        console.log('[DEBUG] Sphere explanations shown');
      }
      
      container.scrollIntoView({behavior: "smooth", block: "start"});
    }
  } catch (error) {
    console.error('[ERROR] Exception in button handler:', error);
  }
});

function valide(date, name) {
  /* проверка имени. Имя может содержать только буквы, тире или писаться через пробел (если несколько имён) */
  let errorMessage = '';
  const nameValide = /^[а-яё\- ]*[a-z\- ]*$/i;

  if(date === 'Invalid Date'){
    console.log('la date est invalide');
  }

  if (name === '' || isNaN(date.getFullYear()) === true) {
    errorMessage += `<p>Date is not valid or one of the fields is empty.</p>`;
  }

  let today = new Date();
  if (date > today) {
    errorMessage += `<p>Date can't be in the future.</p>`;
  }

  if (today.getFullYear() - date.getFullYear() > 120) {
    errorMessage += `<p>Date can't be so far in the past.</p>`;
  }

  // ставит ограничитель в календаре на даты, которые были раньше 120 лет назад
  let ancientDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDay());
  document.getElementById('date').setAttribute("min", ancientDate.toLocaleDateString("en-CA"));

  if (!nameValide.test(name)) {
    errorMessage += `<p>Name format is incorrect: allowed characters are letters, dash and space. Example: Anna, Anna-Maria, Anna Maria.</p>`;
  }
  if (errorMessage !== '') return errorMessage;

  return true;
}
