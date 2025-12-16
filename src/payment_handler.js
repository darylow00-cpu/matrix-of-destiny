/**
 * Обработчик кнопки оплаты для разблокировки контента
 */

// Добавить обработчик кнопки после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const paymentButton = document.getElementById('decode-matrix-btn');
    
    if (paymentButton) {
        paymentButton.addEventListener('click', handlePaymentClick);
    }
});

/**
 * Обработка клика по кнопке оплаты
 */
async function handlePaymentClick() {
    try {
        // Определить тип услуги по текущей странице
        const currentPage = window.location.pathname;
        const serviceType = currentPage.includes('compatibility') ? 'compatibility' : 'personal';
        
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
        
        // ТЕСТОВЫЙ РЕЖИМ: эмулируем успешную оплату без реального платежа
        console.log('[payment_handler TEST MODE] Эмуляция успешной оплаты без реального запроса');
        
        // Скрыть индикатор загрузки
        hideLoadingIndicator();
        
        // Имитируем успешный платеж
        const fakePaymentId = 'test_payment_' + Date.now();
        localStorage.setItem('currentPaymentId', fakePaymentId);
        localStorage.setItem('premiumAccess', 'true');
        localStorage.setItem('premiumAccessDate', new Date().toISOString());
        localStorage.setItem('premiumPaymentId', fakePaymentId);
        localStorage.setItem('premiumStatus', 'paid');
        localStorage.setItem('premiumMatrixKey', matrixKey);
        
        // Показать сообщение об успехе
        PaymentService.showSuccessMessage();
        
        // Разблокировать контент
        PaymentService.unlockContent(fakePaymentId, matrixKey);
        
        // Убрать сохраненные данные расчета
        localStorage.removeItem('paymentCalcData');
        localStorage.removeItem('paymentMatrixKeyPending');
        localStorage.removeItem('currentPaymentId');
    } catch (error) {
        hideLoadingIndicator();
        console.error('Ошибка при обработке платежа:', error);
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
        button.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                "></span>
                Переход к оплате...
            </span>
        `;
    }
    
    // Добавить анимацию вращения, если её ещё нет
    if (!document.getElementById('spin-animation')) {
        const style = document.createElement('style');
        style.id = 'spin-animation';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
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
