/**
 * Cloudflare Worker для обработки платежей через ЮKassa API
 * Разверни на workers.cloudflare.com (бесплатно, без карты)
 */

// Конфигурация (добавь в Environment Variables на Cloudflare)
const SHOP_ID = '383745'; // Замени на свой SHOP_ID
const SECRET_KEY = 'test_AG7eOF4eR-_4xGgvAiuGg6WfQY4qmv2B73TRN0xRoHQ'; // Замени на свой SECRET_KEY
const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

// Цены услуг
const PRICES = {
  personal: {
    amount: '590.00',
    description: 'Полный расклад Матрицы Судьбы'
  },
  compatibility: {
    amount: '590.00',
    description: 'Матрица совместимости'
  }
};

// URL для возврата после оплаты
const RETURN_URLS = {
  personal: 'https://www.xn--80aaxovl4a.site/index.html?payment=success',
  compatibility: 'https://www.xn--80aaxovl4a.site/compatibility.html?payment=success'
};

// Генерация UUID для идемпотентности
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// CORS заголовки
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Обработка OPTIONS (preflight)
function handleOptions(request) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}

// Создание платежа
async function createPayment(request) {
  try {
    const data = await request.json();
    const serviceType = data.service_type || 'personal';
    
    if (!PRICES[serviceType]) {
      return jsonResponse({ error: 'Неверный тип услуги' }, 400, request);
    }
    
    const priceInfo = PRICES[serviceType];
    const returnUrl = RETURN_URLS[serviceType];
    const idempotenceKey = generateUUID();
    
    // Формирование запроса к ЮKassa
    const paymentData = {
      amount: {
        value: priceInfo.amount,
        currency: 'RUB'
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl
      },
      description: priceInfo.description,
      metadata: {
        service_type: serviceType,
        created_at: new Date().toISOString()
      }
    };
    
    // Добавление данных пользователя
    if (data.user_data) {
      paymentData.metadata.user_data = JSON.stringify(data.user_data);
    }
    
    // Отправка запроса к ЮKassa
    const auth = btoa(`${SHOP_ID}:${SECRET_KEY}`);
    const response = await fetch(YOOKASSA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(paymentData)
    });
    
    if (response.ok) {
      const payment = await response.json();
      return jsonResponse({
        success: true,
        payment_id: payment.id,
        confirmation_url: payment.confirmation.confirmation_url,
        status: payment.status
      }, 200, request);
    } else {
      const errorText = await response.text();
      return jsonResponse({
        error: 'Ошибка создания платежа',
        details: errorText
      }, response.status, request);
    }
    
  } catch (error) {
    return jsonResponse({ error: error.message }, 500, request);
  }
}

// Проверка статуса платежа
async function checkPayment(paymentId, request) {
  try {
    const auth = btoa(`${SHOP_ID}:${SECRET_KEY}`);
    const response = await fetch(`${YOOKASSA_API_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (response.ok) {
      const payment = await response.json();
      return jsonResponse({
        success: true,
        status: payment.status,
        paid: payment.paid,
        amount: payment.amount,
        metadata: payment.metadata || {}
      }, 200, request);
    } else {
      const errorText = await response.text();
      return jsonResponse({
        error: 'Ошибка проверки платежа',
        details: errorText
      }, response.status, request);
    }
    
  } catch (error) {
    return jsonResponse({ error: error.message }, 500, request);
  }
}

// Webhook от ЮKassa
async function handleWebhook(request) {
  try {
    const data = await request.json();
    const eventType = data.event;
    const paymentObject = data.object;
    
    if (eventType === 'payment.succeeded') {
      const paymentId = paymentObject.id;
      const metadata = paymentObject.metadata || {};
      
      // Здесь можно добавить логику (отправка email, сохранение в БД)
      console.log(`Платеж ${paymentId} успешно выполнен`, metadata);
    }
    
    return jsonResponse({ success: true }, 200, request);
    
  } catch (error) {
    return jsonResponse({ error: error.message }, 500, request);
  }
}

// Health check
function handleHealth(request) {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString()
  }, 200, request);
}

// Вспомогательная функция для JSON ответов с CORS
function jsonResponse(data, status, request) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin)
    }
  });
}

// Главный обработчик
export default {
  async fetch(request, env) {
    // Переопределяем константы из environment variables, если они есть
    const SHOP_ID_ENV = env.YOOKASSA_SHOP_ID || SHOP_ID;
    const SECRET_KEY_ENV = env.YOOKASSA_SECRET_KEY || SECRET_KEY;
    
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Обработка OPTIONS (preflight)
    if (method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // Роутинг
    if (path === '/create-payment' && method === 'POST') {
      return createPayment(request);
    }
    
    if (path.startsWith('/check-payment/') && method === 'GET') {
      const paymentId = path.split('/check-payment/')[1];
      return checkPayment(paymentId, request);
    }
    
    if (path === '/webhook' && method === 'POST') {
      return handleWebhook(request);
    }
    
    if (path === '/health' && method === 'GET') {
      return handleHealth(request);
    }
    
    // 404
    return jsonResponse({ error: 'Not Found' }, 404, request);
  }
};
