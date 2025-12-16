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
        console.log('[payment] restorePendingCalculation called, data:', raw);
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
        console.log('[payment] restoring', { serviceType, userData });

        if (serviceType === 'personal') {
            const d = document.getElementById('date');
            const n = document.getElementById('name');
            if (d && userData.birthdate) d.value = userData.birthdate;
            if (n && userData.name) n.value = userData.name;
            // Автоматически пересчитать, если кнопка есть
            const btn = document.getElementById('get_the_answer');
            console.log('[payment] personal button found:', !!btn);
            if (btn && userData.birthdate && userData.name) {
                setTimeout(() => {
                    console.log('[payment] clicking personal calc button');
                    btn.click();
                }, 100);
            }
        } else if (serviceType === 'compatibility') {
            const d1 = document.getElementById('date_person1');
            const d2 = document.getElementById('date_person2');
            console.log('[payment] compat inputs found:', { d1: !!d1, d2: !!d2 });
            if (d1 && userData.partner1_birthdate) d1.value = userData.partner1_birthdate;
            if (d2 && userData.partner2_birthdate) d2.value = userData.partner2_birthdate;
            const btn = document.getElementById('createChart');
            console.log('[payment] compat button found:', !!btn, 'data:', userData);
            if (btn && userData.partner1_birthdate && userData.partner2_birthdate) {
                setTimeout(() => {
                    console.log('[payment] clicking compat calc button');
                    btn.click();
                }, 200);
            }
        }
    },
    
    /**
     * Создание платежа с retry логикой
     * @param {string} serviceType - Тип услуги: 'personal' или 'compatibility'
     * @param {object} userData - Данные пользователя (опционально)
     * @param {string} returnUrl - URL возврата после оплаты
     * @returns {Promise<object>}
     */
    async createPayment(serviceType, userData = {}, returnUrl = '') {
        console.log('[payment] createPayment called', { serviceType, userData, returnUrl });
        
        const maxRetries = 2;
        let lastError = null;
        
        // Определяем таймаут в зависимости от устройства (больше для мобильных)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const timeoutMs = isMobile ? 30000 : 15000;
        
        console.log('[payment] Device:', isMobile ? 'Mobile' : 'Desktop', 'Timeout:', timeoutMs + 'ms');
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`[payment] Retry attempt ${attempt}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
                
                console.log(`[payment] Attempt ${attempt + 1}: Sending request to ${this.serverUrl}/create-payment`);
                
                // Используем AbortController только если поддерживается
                let controller = null;
                let timeoutId = null;
                
                const fetchOptions = {
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
                };
                
                if (typeof AbortController !== 'undefined') {
                    controller = new AbortController();
                    fetchOptions.signal = controller.signal;
                    timeoutId = setTimeout(() => {
                        console.log('[payment] Request timeout, aborting...');
                        controller.abort();
                    }, timeoutMs);
                } else {
                    console.log('[payment] AbortController not supported');
                }
                
                const response = await fetch(`${this.serverUrl}/create-payment`, fetchOptions);
                
                if (timeoutId) clearTimeout(timeoutId);
                
                console.log('[payment] Response received:', response.status, response.statusText);

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    const text = await response.text();
                    console.warn('[create-payment] non-JSON response', { url: response.url, status: response.status, type: response.type, text: text.slice(0, 200) });
                    throw new Error(`Сервер вернул не JSON (status ${response.status}).`);
                }

                const data = await response.json();
                console.log('[payment] Response data:', data);
                
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
                lastError = error;
                console.error(`[payment] Ошибка создания платежа (попытка ${attempt + 1}):`, error.name, error.message);
                
                if (attempt === maxRetries) {
                    break;
                }
            }
        }
        
        return {
            success: false,
            error: lastError?.message || 'Не удалось создать платеж'
        };
    },
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
            } else if (typeof updateSphereContent === 'function') {
                // Личный расчёт: подставляем тексты для ранее заблокированных сфер
                const arcanaSpans = document.querySelectorAll('.sphere-arcana[id^="sphere-"]');
                arcanaSpans.forEach(span => {
                    const sid = span.id;
                    const n = parseInt((span.textContent || '').trim(), 10);
                    if (!Number.isNaN(n)) {
                        updateSphereContent(sid, n);
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
    },

    /**
     * Сбросить премиум-доступ, если ключ матрицы не совпадает с текущим
     * Вызывается перед каждым новым расчётом
     */
    resetPremiumIfKeyMismatch() {
        const storedKey = localStorage.getItem('premiumMatrixKey') || '';
        const currentKey = this.getCurrentMatrixKey();
        
        console.log('[payment] Checking matrix key:', { storedKey, currentKey });
        
        // Если ключи не совпадают — сбрасываем премиум доступ
        if (storedKey && storedKey !== currentKey) {
            console.log('[payment] Matrix key mismatch - clearing premium access');
            localStorage.removeItem('premiumAccess');
            localStorage.removeItem('premiumAccessDate');
            localStorage.removeItem('premiumStatus');
            localStorage.removeItem('premiumPaymentId');
            localStorage.removeItem('premiumMatrixKey');
            
            // Восстанавливаем замки на странице
            this.restoreLocks();
            return false;
        }
        
        return true;
    },

    /**
     * Восстановить замки на заблокированных элементах
     */
    restoreLocks() {
        console.log('[payment] Restoring locks');
        
        // Находим все элементы с premium-контентом
        const lockedElements = document.querySelectorAll('[data-premium="true"]');
        
        lockedElements.forEach(element => {
            // Скрываем контент
            element.style.filter = 'blur(5px)';
            element.style.pointerEvents = 'none';
            element.style.userSelect = 'none';
            
            // Ищем или создаем замок
            let lockOverlay = element.querySelector('.premium-lock-overlay');
            if (!lockOverlay) {
                lockOverlay = document.createElement('div');
                lockOverlay.className = 'premium-lock-overlay';
                lockOverlay.innerHTML = `
                    <svg class="lock-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M12 1C8.676 1 6 3.676 6 7v2H5c-1.105 0-2 .895-2 2v10c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V11c0-1.105-.895-2-2-2h-1V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.105 0 2 .895 2 2s-.895 2-2 2-2-.895-2-2 .895-2 2-2z"/>
                    </svg>
                    <span class="lock-text">Премиум контент</span>
                `;
                element.style.position = 'relative';
                element.appendChild(lockOverlay);
            } else {
                lockOverlay.style.display = 'flex';
            }
        });
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

    // Задержка для восстановления расчета, чтобы все скрипты успели загрузиться
    setTimeout(() => {
        PaymentService.restorePendingCalculation();
    }, 300);

    // Проверить статус оплаты при возврате
    PaymentService.handlePaymentReturn();
    
    // Проверить сохраненный доступ
    PaymentService.checkPremiumAccess();
});

// Экспорт для использования в других скриптах
window.PaymentService = PaymentService;
