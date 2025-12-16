/**
 * Обработчик кнопки оплаты для разблокировки контента
 */

// Добавить обработчик кнопки после загрузки DOM (без жёсткой проверки PaymentService)
document.addEventListener('DOMContentLoaded', () => {
    const paymentButton = document.getElementById('decode-matrix-btn');
    if (paymentButton) {
        paymentButton.addEventListener('click', handlePaymentClick);
    }
});

// Гарантируем, что PaymentService загружен (ленивая подгрузка при клике)
async function ensurePaymentServiceReady(retries = 4, delayMs = 300) {
    // 1) Ждем наличие PaymentService
    for (let i = 0; i <= retries; i++) {
        if (typeof PaymentService !== 'undefined') {
            console.log('[payment_handler] PaymentService ready');
            return true;
        }

        if (i === retries) break;

        console.warn('[payment_handler] PaymentService not ready, retrying load...', { attempt: i + 1 });
        await new Promise(res => setTimeout(res, delayMs));
    }

    // 2) Проверяем, есть ли статический тег payment.js
    const staticTag = Array.from(document.scripts).find(s => (s.src || '').includes('/src/payment.js'));
    if (!staticTag) {
        console.warn('[payment_handler] Static payment.js tag not found, will inject dynamically');
    }

    // 3) Пытаемся динамически подгрузить payment.js
    await new Promise((resolve) => {
        loadPaymentScript(() => {
            resolve();
        });
    });

    // 4) После динамической загрузки снова ждём и проверяем
    for (let i = 0; i <= retries + 2; i++) {
        if (typeof PaymentService !== 'undefined') {
            console.log('[payment_handler] PaymentService loaded via dynamic script');
            return true;
        }
        if (i === retries) break;
        await new Promise(res => setTimeout(res, delayMs * 2));
    }

    console.error('[payment_handler] PaymentService still undefined after dynamic load');
    return false;
}

// Динамическая подгрузка payment.js при сбое (для мобильных, когда кеш сломан)
function loadPaymentScript(onLoaded) {
    const existing = document.querySelector('script[data-dynamic-payment="true"]');
    if (existing) existing.remove();
    const script = document.createElement('script');
    // Надёжно строим URL скрипта: учитываем поддиректорию и кэш-бастинг
    const scriptUrl = new URL('src/payment.js', window.location.href).toString();
    script.src = `${scriptUrl}?v=2025-12-16t&reload=${Date.now()}`;
    script.async = false;
    script.crossOrigin = 'anonymous';
    script.dataset.dynamicPayment = 'true';
    script.onload = () => {
        console.log('[payment_handler] payment.js dynamically loaded');
        onLoaded && onLoaded();
    };
    script.onerror = () => {
        console.error('[payment_handler] Failed to dynamically load payment.js');
        alert('Не удалось загрузить модуль оплаты. Попробуйте обновить страницу.');
        onLoaded && onLoaded();
    };
    document.head.appendChild(script);
}

/**
 * Обработка клика по кнопке оплаты
 */
async function handlePaymentClick() {
    console.log('[payment_handler] Button clicked');
    
    try {
        // Убеждаемся, что модуль оплаты загружен
        const ready = await ensurePaymentServiceReady();
        if (!ready) {
            alert('Не удалось загрузить модуль оплаты. Обновите страницу или попробуйте другой браузер.');
            return;
        }

        // Определить тип услуги по текущей странице
        const currentPage = window.location.pathname;
        const serviceType = currentPage.includes('compatibility') ? 'compatibility' : 'personal';
        
        console.log('[payment_handler] Service type:', serviceType, 'Page:', currentPage);
        
        // Собрать данные пользователя
        const userData = collectUserData(serviceType);
        console.log('[payment_handler] collected userData:', userData, 'serviceType:', serviceType);
        
        // Сохранить ключ текущей матрицы, чтобы разблокировать только её
        const matrixKey = buildMatrixKey(serviceType);
        localStorage.setItem('paymentMatrixKeyPending', matrixKey);

        // Сохранить данные расчета, чтобы восстановить после возврата
        const calcData = { serviceType, userData };
        localStorage.setItem('paymentCalcData', JSON.stringify(calcData));
        console.log('[payment_handler] saved to localStorage:', calcData);
        
        // Показать индикатор загрузки
        console.log('[payment_handler] Showing loading indicator');
        showLoadingIndicator();
        
        function buildMatrixKey(serviceType) {
            if (serviceType === 'compatibility') {
                const d1 = document.getElementById('date_person1')?.value || '';
                const d2 = document.getElementById('date_person2')?.value || '';
                return `${serviceType}|${d1}|${d2}`;
            }
            const d = document.getElementById('date')?.value || '';
            const n = (document.getElementById('name')?.value || '').trim();
            return `${serviceType}|${d}|${n}`;
        }
        
        // Создать платеж через backend
        console.log('[payment_handler] Creating payment...');
        const returnUrl = window.location.href; // Вернуться на текущую страницу
        const result = await PaymentService.createPayment(serviceType, userData, returnUrl);
        
        console.log('[payment_handler] Payment result:', result);
        
        // Скрыть индикатор загрузки
        hideLoadingIndicator();
        
        if (result.success) {
            // Сохранить ID платежа
            localStorage.setItem('currentPaymentId', result.paymentId);
            
            // Перенаправить на страницу оплаты
            PaymentService.redirectToPayment(result.confirmationUrl);
        } else {
            throw new Error(result.error || 'Не удалось создать платеж');
        }
    } catch (error) {
        hideLoadingIndicator();
        console.error('Ошибка при обработке платежа:', error);
        
        // Показываем детали ошибки для отладки на мобильных
        const errorDetails = `Тип: ${error.name}\nСообщение: ${error.message}\nСтек: ${error.stack?.substring(0, 100) || 'нет'}`;
        console.log('[payment_handler] Error details:', errorDetails);
        
        // Временно показываем alert для отладки на мобильных
        alert('Ошибка оплаты:\n' + error.name + '\n' + error.message);
        
        showErrorMessage('Произошла ошибка. Попробуйте позже.');
    }
}

/**
 * Собрать данные пользователя для метаданных платежа
 */
function collectUserData(serviceType) {
    const userData = {
        page: serviceType,
        timestamp: new Date().toISOString()
    };
    
    if (serviceType === 'personal') {
        const dateInput = document.getElementById('date');
        const nameInput = document.getElementById('name');
        
        if (dateInput && dateInput.value) {
            userData.birthdate = dateInput.value;
        }
        if (nameInput && nameInput.value) {
            userData.name = nameInput.value;
        }
    } else if (serviceType === 'compatibility') {
        const date1 = document.getElementById('date_person1');
        const date2 = document.getElementById('date_person2');
        
        if (date1 && date1.value) {
            userData.partner1_birthdate = date1.value;
        }
        if (date2 && date2.value) {
            userData.partner2_birthdate = date2.value;
        }
    }
    
    return userData;
}

/**
 * Показать индикатор загрузки
 */
function showLoadingIndicator() {
    const button = document.getElementById('decode-matrix-btn');
    if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        // Просто сменяем текст на "Переход к оплате..."
        button.textContent = 'Переход к оплате...';
    }
}

/**
 * Скрыть индикатор загрузки
 */
function hideLoadingIndicator() {
    const button = document.getElementById('decode-matrix-btn');
    if (button && button.dataset.originalText) {
        button.disabled = false;
        button.textContent = button.dataset.originalText;
    }
}

/**
 * Показать сообщение об ошибке
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'payment-error-message';
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f44336, #d32f2f);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(244, 67, 54, 0.3);
            z-index: 10000;
            animation: slideIn 0.5s ease;
            max-width: 300px;
        ">
            <h3 style="margin: 0 0 8px 0; font-size: 18px;">⚠ Ошибка</h3>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">${message}</p>
        </div>
    `;
    document.body.appendChild(errorDiv);
    
    // Удалить сообщение через 5 секунд
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
