/**
 * Клиентская часть для интеграции с платежной системой ЮKassa
 */

const PaymentService = {
    // URL вашего сервера обработки платежей
    serverUrl: 'https://matrix-backend.onrender.com', // Продакшн-бэкенд
    
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
});

// Экспорт для использования в других скриптах
window.PaymentService = PaymentService;
