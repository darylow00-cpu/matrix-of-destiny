/**
 * Клиентская часть для интеграции с платежной системой ЮKassa
 */

const PaymentService = {
    // URL сервера обработки платежей: авто-переключение dev/prod
    serverUrl: (function() {
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        return isLocal ? 'http://127.0.0.1:5000' : 'https://matrix-payment.darya-chubik.workers.dev';
    })(),

    /**
     * Проверка здоровья backend
     * @returns {Promise<{ok:boolean, error?:string}>}
     */
    async checkHealth() {
        try {
            const res = await fetch(`${this.serverUrl}/health`, { method: 'GET' });
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
                const text = await res.text();
                return { ok: false, error: `Health returned non-JSON (status ${res.status}): ${text.slice(0, 120)}` };
            }
            const data = await res.json();
            return { ok: res.ok && data.status === 'ok' };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    },
    
    /**
     * Создание платежа
     * @param {string} serviceType - Тип услуги: 'personal' или 'compatibility'
     * @param {object} userData - Данные пользователя (опционально)
     * @returns {Promise<object>}
     */
    async createPayment(serviceType, userData = {}) {
        try {
            const response = await fetch(`${this.serverUrl}/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service_type: serviceType,
                    user_data: userData
                })
            });

            // Если сервер вернул HTML (например, вместо API), не пытаемся парсить как JSON
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Сервер вернул не JSON (status ${response.status}). Текст: ${text.slice(0, 200)}`);
            }

            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    paymentId: data.payment_id,
                    confirmationUrl: data.confirmation_url
                };
            } else {
                throw new Error(data.error || 'Ошибка создания платежа');
            }
        } catch (error) {
            console.error('Ошибка создания платежа:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * Проверка статуса платежа
     * @param {string} paymentId - ID платежа
     * @returns {Promise<object>}
     */
    async checkPayment(paymentId) {
        try {
            const response = await fetch(`${this.serverUrl}/check-payment/${paymentId}`);

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Сервер вернул не JSON (status ${response.status}). Текст: ${text.slice(0, 200)}`);
            }

            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    status: data.status,
                    paid: data.paid
                };
            } else {
                throw new Error(data.error || 'Ошибка проверки платежа');
            }
        } catch (error) {
            console.error('Ошибка проверки платежа:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * Перенаправление на страницу оплаты
     * @param {string} confirmationUrl - URL страницы оплаты
     */
    redirectToPayment(confirmationUrl) {
        window.location.href = confirmationUrl;
    },
    
    /**
     * Обработка возврата после оплаты
     */
    handlePaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        
        if (paymentStatus === 'success') {
            // Показать уведомление об успешной оплате
            this.showSuccessMessage();
            
            // Разблокировать контент
            this.unlockContent();
        }
    },
    
    /**
     * Показать сообщение об успешной оплате
     */
    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'payment-success-message';
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
                z-index: 10000;
                animation: slideIn 0.5s ease;
            ">
                <h3 style="margin: 0 0 8px 0; font-size: 18px;">✓ Оплата прошла успешно!</h3>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Все блоки разблокированы</p>
            </div>
        `;
        document.body.appendChild(message);
        
        // Удалить сообщение через 5 секунд
        setTimeout(() => {
            message.remove();
        }, 5000);
    },
    
    /**
     * Разблокировать платный контент
     */
    unlockContent() {
        // Убрать замки с премиум блоков
        const lockedItems = document.querySelectorAll('.locked');
        lockedItems.forEach(item => {
            item.classList.remove('locked');
            const overlay = item.querySelector('.locked-overlay');
            if (overlay) {
                overlay.remove();
            }
        });
        
        // Сохранить статус оплаты в localStorage
        localStorage.setItem('premiumAccess', 'true');
        localStorage.setItem('premiumAccessDate', new Date().toISOString());
    },
    
    /**
     * Проверить наличие оплаченного доступа
     */
    checkPremiumAccess() {
        const hasAccess = localStorage.getItem('premiumAccess') === 'true';
        if (hasAccess) {
            this.unlockContent();
        }
        return hasAccess;
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверить статус оплаты при возврате
    PaymentService.handlePaymentReturn();
    
    // Проверить сохраненный доступ
    PaymentService.checkPremiumAccess();

    // Легкий health-check backend, чтобы заранее подсветить проблемы
    PaymentService.checkHealth().then((h) => {
        if (!h.ok) {
            console.warn('Платёжный сервер недоступен:', h.error || 'unknown error');
            const banner = document.createElement('div');
            banner.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#2b223f;color:#fff;border:1px solid #b653f7;padding:12px 16px;border-radius:10px;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,0.3);max-width:340px;font-size:13px;line-height:1.5;';
            banner.innerHTML = `
                <strong style="color:#b653f7;">Оплата временно недоступна</strong><br/>
                Сервер: <code>${PaymentService.serverUrl}</code><br/>
                ${h.error ? 'Ошибка: ' + h.error : 'Причина не определена'}
            `;
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 8000);
        }
    });
});

// Экспорт для использования в других скриптах
window.PaymentService = PaymentService;
