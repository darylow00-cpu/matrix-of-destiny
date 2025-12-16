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
            const res = await fetch(`${this.serverUrl}/health`, { method: 'GET', mode: 'cors', cache: 'no-store', credentials: 'omit' });
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
                const text = await res.text();
                console.warn('[health] non-JSON response', { url: res.url, status: res.status, type: res.type, text: text.slice(0, 200) });
                return { ok: false, error: `Health returned non-JSON (status ${res.status})` };
            }
            const data = await res.json();
            return { ok: res.ok && data.status === 'ok' };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    },

    /**
     * Восстановить расчет после возврата/отмены
     */
    restorePendingCalculation() {
        const raw = localStorage.getItem('paymentCalcData');
        if (!raw) return;
        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            localStorage.removeItem('paymentCalcData');
            return;
        }

        const serviceType = data.serviceType || this.getCurrentServiceType();
        const userData = data.userData || {};

        if (serviceType === 'personal') {
            const d = document.getElementById('date');
            const n = document.getElementById('name');
            if (d && userData.birthdate) d.value = userData.birthdate;
            if (n && userData.name) n.value = userData.name;
            // Автоматически пересчитать, если кнопка есть
            const btn = document.getElementById('get_the_answer');
            if (btn && userData.birthdate && userData.name) {
                setTimeout(() => btn.click(), 50);
            }
        } else if (serviceType === 'compatibility') {
            const d1 = document.getElementById('date_person1');
            const d2 = document.getElementById('date_person2');
            if (d1 && userData.partner1_birthdate) d1.value = userData.partner1_birthdate;
            if (d2 && userData.partner2_birthdate) d2.value = userData.partner2_birthdate;
            const btn = document.getElementById('createChart');
            if (btn && userData.partner1_birthdate && userData.partner2_birthdate) {
                setTimeout(() => btn.click(), 50);
            }
        }
    },
    
    /**
     * Создание платежа
     * @param {string} serviceType - Тип услуги: 'personal' или 'compatibility'
     * @param {object} userData - Данные пользователя (опционально)
     * @param {string} returnUrl - URL возврата после оплаты
     * @returns {Promise<object>}
     */
    async createPayment(serviceType, userData = {}, returnUrl = '') {
        try {
            const response = await fetch(`${this.serverUrl}/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                cache: 'no-store',
                credentials: 'omit',
                body: JSON.stringify({
                    service_type: serviceType,
                    user_data: userData,
                    return_url: returnUrl
                })
            });

            // Если сервер вернул HTML (например, вместо API), не пытаемся парсить как JSON
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.warn('[create-payment] non-JSON response', { url: response.url, status: response.status, type: response.type, text: text.slice(0, 200) });
                throw new Error(`Сервер вернул не JSON (status ${response.status}).`);
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
            const response = await fetch(`${this.serverUrl}/check-payment/${paymentId}`, { method: 'GET', mode: 'cors', cache: 'no-store', credentials: 'omit' });

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.warn('[check-payment] non-JSON response', { url: response.url, status: response.status, type: response.type, text: text.slice(0, 200) });
                throw new Error(`Сервер вернул не JSON (status ${response.status}).`);
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
     * Определить текущий тип услуги по URL
     */
    getCurrentServiceType() {
        return window.location.pathname.includes('compatibility') ? 'compatibility' : 'personal';
    },

    /**
     * Построить ключ текущей матрицы (чтобы не открывать чужие расчеты)
     */
    getCurrentMatrixKey(serviceType = this.getCurrentServiceType()) {
        if (serviceType === 'compatibility') {
            const d1 = document.getElementById('date_person1')?.value || '';
            const d2 = document.getElementById('date_person2')?.value || '';
            return `${serviceType}|${d1}|${d2}`;
        }
        const d = document.getElementById('date')?.value || '';
        const n = (document.getElementById('name')?.value || '').trim();
        return `${serviceType}|${d}|${n}`;
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
    async handlePaymentReturn() {
        const paymentId = localStorage.getItem('currentPaymentId');
        const desired = localStorage.getItem('paymentReturnUrl');
        // Если платежа нет, но есть сохраненный returnUrl, вернуть пользователя обратно
        if (!paymentId) {
            if (desired && desired !== window.location.href) {
                localStorage.removeItem('paymentReturnUrl');
                window.location.href = desired;
                return;
            }
            localStorage.removeItem('paymentReturnUrl');
            return;
        }

        const result = await this.checkPayment(paymentId);
        // Очистим ID, чтобы не зациклить проверки
        localStorage.removeItem('currentPaymentId');

        const pendingKey = localStorage.getItem('paymentMatrixKeyPending') || '';
        localStorage.removeItem('paymentMatrixKeyPending');

        if (result.success && result.paid) {
            this.showSuccessMessage();
            this.unlockContent(paymentId, pendingKey || this.getCurrentMatrixKey());
        } else {
            const msg = result.error || 'Оплата не завершена или отменена.';
            alert(msg);
        }

        // Вернуться на исходную страницу расчета, если сохраняли return_url
        if (desired && desired !== window.location.href) {
            localStorage.removeItem('paymentReturnUrl');
            window.location.href = desired;
        } else {
            localStorage.removeItem('paymentReturnUrl');
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
    unlockContent(paymentId = '', matrixKey = '') {
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
        if (paymentId) {
            localStorage.setItem('premiumPaymentId', paymentId);
            localStorage.setItem('premiumStatus', 'paid');
        }
        if (matrixKey) {
            localStorage.setItem('premiumMatrixKey', matrixKey);
        }

        // Если мы на странице совместимости, заполнить контент для ранее заблокированных сфер
        try {
            if (window.location.pathname.includes('compatibility') && typeof updateCompatibilitySphereContent === 'function') {
                const spheres = document.querySelectorAll('[id^="sphere-"]');
                spheres.forEach(item => {
                    const sid = item.id;
                    const arcSpan = item.querySelector(`#${sid}-arcana`);
                    if (arcSpan) {
                        const n = parseInt((arcSpan.textContent || '').trim(), 10);
                        if (!Number.isNaN(n)) {
                            updateCompatibilitySphereContent(sid, n);
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('[compatibility] post-unlock fill failed', e);
        }
    },
    
    /**
     * Проверить наличие оплаченного доступа
     */
    checkPremiumAccess() {
        const hasAccess = localStorage.getItem('premiumAccess') === 'true';
        const paymentId = localStorage.getItem('premiumPaymentId');
        const status = localStorage.getItem('premiumStatus');
        const storedKey = localStorage.getItem('premiumMatrixKey') || '';
        const currentKey = this.getCurrentMatrixKey();

        // Если нет подтвержденного платежа или ключ не совпадает с текущей матрицей — сбрасываем
        if (hasAccess && (!paymentId || status !== 'paid' || !storedKey || storedKey !== currentKey)) {
            localStorage.removeItem('premiumAccess');
            localStorage.removeItem('premiumAccessDate');
            localStorage.removeItem('premiumStatus');
            localStorage.removeItem('premiumPaymentId');
            localStorage.removeItem('premiumMatrixKey');
            return false;
        }

        if (hasAccess && paymentId && status === 'paid' && storedKey === currentKey) {
            this.unlockContent(paymentId, storedKey);
            return true;
        }
        return false;
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.info('[payment] using serverUrl:', PaymentService.serverUrl);
    // Санитация устаревшего состояния оплаты
    if (localStorage.getItem('premiumAccess') === 'true' && !localStorage.getItem('premiumPaymentId')) {
        localStorage.removeItem('premiumAccess');
        localStorage.removeItem('premiumAccessDate');
    }

    // Восстановить расчет после возврата/отмены
    PaymentService.restorePendingCalculation();

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
