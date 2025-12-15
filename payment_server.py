"""
Сервер для обработки платежей через ЮKassa API
"""

from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import requests
import uuid
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Конфигурация ЮKassa (добавь свои данные)
SHOP_ID = os.getenv('YOOKASSA_SHOP_ID', '1216355')
SECRET_KEY = os.getenv('YOOKASSA_SECRET_KEY', 'live_4HLJTKgkns4MO4wT57q6d2f3GxiF4bKXymM5Of8SBZY')
YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments'

# Цены услуг
PRICES = {
    'personal': {
        'amount': '590.00',
        'description': 'Полный расклад Матрицы Судьбы'
    },
    'compatibility': {
        'amount': '590.00',
        'description': 'Матрица совместимости'
    }
}

# URL для возврата после оплаты
RETURN_URLS = {
    'personal': 'https://www.xn--80aaxovl4a.site/index.html?payment=success',
    'compatibility': 'https://www.xn--80aaxovl4a.site/compatibility.html?payment=success'
}


@app.route('/create-payment', methods=['POST'])
def create_payment():
    """
    Создание платежа в ЮKassa
    Ожидает JSON: {
        "service_type": "personal" или "compatibility",
        "user_data": {...} // опционально, данные пользователя
    }
    """
    try:
        data = request.get_json()
        service_type = data.get('service_type', 'personal')
        
        if service_type not in PRICES:
            return jsonify({'error': 'Неверный тип услуги'}), 400
        
        # Генерация ключа идемпотентности
        idempotence_key = str(uuid.uuid4())
        
        # Данные для платежа
        price_info = PRICES[service_type]
        return_url = RETURN_URLS[service_type]
        
        # Формирование запроса к ЮKassa
        payment_data = {
            'amount': {
                'value': price_info['amount'],
                'currency': 'RUB'
            },
            'capture': True,
            'confirmation': {
                'type': 'redirect',
                'return_url': return_url
            },
            'description': price_info['description'],
            'metadata': {
                'service_type': service_type,
                'created_at': datetime.now().isoformat()
            }
        }
        
        # Добавление данных пользователя в метаданные
        user_data = data.get('user_data', {})
        if user_data:
            payment_data['metadata']['user_data'] = str(user_data)
        
        # Отправка запроса к ЮKassa
        headers = {
            'Idempotence-Key': idempotence_key,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            YOOKASSA_API_URL,
            json=payment_data,
            headers=headers,
            auth=(SHOP_ID, SECRET_KEY)
        )
        
        if response.status_code == 200:
            payment = response.json()
            return jsonify({
                'success': True,
                'payment_id': payment['id'],
                'confirmation_url': payment['confirmation']['confirmation_url'],
                'status': payment['status']
            })
        else:
            return jsonify({
                'error': 'Ошибка создания платежа',
                'details': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/check-payment/<payment_id>', methods=['GET'])
def check_payment(payment_id):
    """
    Проверка статуса платежа
    """
    try:
        response = requests.get(
            f'{YOOKASSA_API_URL}/{payment_id}',
            auth=(SHOP_ID, SECRET_KEY)
        )
        
        if response.status_code == 200:
            payment = response.json()
            return jsonify({
                'success': True,
                'status': payment['status'],
                'paid': payment['paid'],
                'amount': payment['amount'],
                'metadata': payment.get('metadata', {})
            })
        else:
            return jsonify({
                'error': 'Ошибка проверки платежа',
                'details': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/webhook', methods=['POST'])
def webhook():
    """
    Webhook для получения уведомлений от ЮKassa о статусе платежа
    """
    try:
        data = request.get_json()
        
        # Здесь можно обработать уведомление
        # Например, разблокировать контент для пользователя
        event_type = data.get('event')
        payment_object = data.get('object')
        
        if event_type == 'payment.succeeded':
            payment_id = payment_object.get('id')
            metadata = payment_object.get('metadata', {})
            
            # Здесь можно добавить логику разблокировки контента
            print(f"Платеж {payment_id} успешно выполнен")
            print(f"Метаданные: {metadata}")
            
            # TODO: Сохранить информацию о платеже в базу данных
            # TODO: Отправить email пользователю
            
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"Ошибка обработки webhook: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """
    Проверка работоспособности сервера
    """
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    # В продакшене используй gunicorn или другой WSGI сервер
    app.run(host='0.0.0.0', port=5000, debug=False)
