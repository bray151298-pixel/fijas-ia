# -*- coding: utf-8 -*-
import asyncio
import logging
import httpx

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('SalesBot')

SUPPORT_BOT_TOKEN = '8651067640:AAEj5wcb4qlIHgm7BjGOdxkUF0ccMRi9LXU'
MAIN_BOT_TOKEN = '8716300226:AAFtHuVEAaxtd1Cq0nMX0wTQsQpzkFkRsas'
ADMIN_TELEGRAM_ID = '5261686165'
VIP_CHANNEL_ID = '-1004358917232'
PUBLIC_CHANNEL = '@FijasIAOficial'
GOOGLE_API_KEY = 'AIzaSyCSSSoFRgd6_eQA0_d6Um07Iz9nI4eHHdo'

BASE_URL = f'https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}'
MAIN_BASE_URL = f'https://api.telegram.org/bot{MAIN_BOT_TOKEN}'

def get_main_menu():
    return {
        'inline_keyboard': [
            [{'text': '👑 Planes y Precios VIP', 'callback_data': 'menu_plans'}, {'text': '💳 Pagar Yape / Plin / Binance', 'callback_data': 'menu_pay'}],
            [{'text': '📊 Estadísticas y Rentabilidad', 'callback_data': 'menu_stats'}, {'text': '❓ ¿Cómo funciona el Bot?', 'callback_data': 'menu_how'}],
            [{'text': '📸 Enviar Comprobante de Pago', 'callback_data': 'menu_upload'}]
        ]
    }

def get_back_menu():
    return {
        'inline_keyboard': [
            [{'text': '💳 Pagar por Yape / Plin', 'callback_data': 'menu_pay'}, {'text': '🔙 Volver al Menú', 'callback_data': 'menu_start'}]
        ]
    }

async def send_message(client, chat_id, text, reply_markup=None):
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'}
    if reply_markup:
        payload['reply_markup'] = reply_markup
    try:
        r = await client.post(f'{BASE_URL}/sendMessage', json=payload, timeout=10.0)
        return r.json()
    except Exception as e:
        logger.error(f'Error send: {e}')
        return None

async def forward_photo_to_admin(client, file_id, caption, client_id, client_username):
    inline_keyboard = {
        'inline_keyboard': [
            [{'text': '✅ APROBAR Y ENVIAR ENLACE VIP', 'callback_data': f'approve_{client_id}_{client_username}'}],
            [{'text': '❌ RECHAZAR PAGO', 'callback_data': f'reject_{client_id}_{client_username}'}]
        ]
    }
    payload = {
        'chat_id': ADMIN_TELEGRAM_ID,
        'photo': file_id,
        'caption': caption,
        'parse_mode': 'Markdown',
        'reply_markup': inline_keyboard
    }
    try:
        r = await client.post(f'{BASE_URL}/sendPhoto', json=payload, timeout=10.0)
        return r.json()
    except Exception as e:
        logger.error(f'Error photo: {e}')
        return None

async def create_vip_invite_link(client):
    try:
        r = await client.post(f'{MAIN_BASE_URL}/createChatInviteLink', json={'chat_id': VIP_CHANNEL_ID, 'member_limit': 1, 'name': 'VIP Member'}, timeout=10.0)
        res = r.json()
        if res.get('ok'):
            return res['result']['invite_link']
    except Exception as e:
        logger.error(f'Error link: {e}')
    return 'https://t.me/+FijasIA_VIP_Acceso'

async def generate_gemini_reply(user_text):
    try:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_API_KEY}'
        prompt = f'Eres el asesor de soporte y ventas de FIJAS IA (apuestas cuantitativas +EV). Responde amable, profesional y persuasivo en espanol en 3 lineas: {user_text}'
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(url, json={'contents': [{'role': 'user', 'parts': [{'text': prompt}]}]})
            if r.status_code == 200:
                return r.json()['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        logger.error(f'Gemini err: {e}')
    return '¡Hola! En FIJAS IA usamos modelos cuantitativos (+EV) para los mejores pronósticos. Elige una opción del menú para ver los planes VIP.'

async def process_update(client, update):
    if 'callback_query' in update:
        cb = update['callback_query']
        cb_id = cb['id']
        data = cb.get('data', '')
        chat_id = cb['message']['chat']['id']
        first_name = cb.get('from', {}).get('first_name', 'Cliente')
        await client.post(f'{BASE_URL}/answerCallbackQuery', json={'callback_query_id': cb_id})

        if data == 'menu_start':
            txt = f'👋 ¡Hola {first_name}! Bienvenido a *FIJAS IA — Soporte & Ventas VIP* ⚽🤖\n\nSomos la primera plataforma de *Inteligencia Deportiva Cuantitativa (+EV)*.\n\n¿En qué te puedo ayudar hoy? Selecciona una opción:'
            await send_message(client, chat_id, txt, get_main_menu())
        elif data == 'menu_plans':
            txt = '👑 *MEMBRESÍAS VIP — FIJAS IA*\n━━━━━━━━━━━━━━━━━━━━━\n⚡ *Pase Semanal (Prueba):* *S/ 19.90* *(o $5 USDT)*\n👑 *Pase Mensual VIP:* *S/ 39.90* *(o $12 USDT)* ⭐ *(Más vendido)*\n💎 *Pase Trimestral (3 Meses):* *S/ 89.90* *(o $25 USDT)*\n\n💰 *¡Con un solo pick ganado recuperas tu suscripción!*\n━━━━━━━━━━━━━━━━━━━━━\n👉 Presiona *\"Pagar por Yape / Plin\"* para ver los datos de transferencia.'
            await send_message(client, chat_id, txt, get_back_menu())
        elif data == 'menu_pay':
            txt = '💳 *DATOS OFICIALES DE PAGO*\n━━━━━━━━━━━━━━━━━━━━━\n📲 *YAPE / PLIN (Perú):*\n• Número: `901326470`\n• Titular: *BRAY YUSMAN QUISPE ATAO*\n\n🟡 *BINANCE PAY / USDT:*\n• Binance Pay ID: `849201948`\n• Red USDT: `BEP-20 (BSC)`\n━━━━━━━━━━━━━━━━━━━━━\n📸 *PASO FINAL:*\nUna vez hecho el pago, *envía la foto/captura de tu comprobante por este mismo chat* y te activaremos tu enlace exclusivo de acceso al Canal VIP.'
            await send_message(client, chat_id, txt, get_back_menu())
        elif data == 'menu_stats':
            txt = '📊 *MÉTRICAS AUDITADAS — FIJAS IA*\n━━━━━━━━━━━━━━━━━━━━━\n• 🎯 *Win Rate Promedio:* *78.4% – 83.3%*\n• 📈 *Yield / ROI Mensual:* *+24% a +28%*\n• 🛡️ *Gestión de Riesgo:* Criterio de Kelly (Máx. 2.0u por pick)\n• 🌐 *Compatibilidad:* 100% universal *(Betano, Bet365, Apuesta Total, Doradobet)*'
            await send_message(client, chat_id, txt, get_back_menu())
        elif data == 'menu_how':
            txt = '❓ *¿CÓMO FUNCIONA FIJAS IA?*\n━━━━━━━━━━━━━━━━━━━━━\n1️⃣ Algoritmo escanea más de 100 partidos diarios de Fútbol, Tenis y NBA.\n2️⃣ Encuentra ineficiencias de cuotas con ventaja matemática (+EV > +8%).\n3️⃣ Te enviamos exactamente a qué apostar y stake sugerido.\n4️⃣ Solo copias la jugada y ganas.'
            await send_message(client, chat_id, txt, get_back_menu())
        elif data == 'menu_upload':
            txt = '📸 *ENVÍO DE COMPROBANTE*\n━━━━━━━━━━━━━━━━━━━━━\nAdjunta y envía la foto o captura de pantalla de tu Yape, Plin o Binance aquí en este chat.\n\nNuestro sistema lo validará y te entregará tu acceso VIP.'
            await send_message(client, chat_id, txt, get_back_menu())
        elif data.startswith('approve_'):
            parts = data.split('_')
            uid = parts[1]
            uname = parts[2] if len(parts) > 2 else 'cliente'
            link = await create_vip_invite_link(client)
            client_msg = f'🎉 *¡PAGO VERIFICADO CON ÉXITO! BIENVENIDO AL CANAL VIP* 👑🏆\n━━━━━━━━━━━━━━━━━━━━━\n👉 *Haz clic aquí para unirte a tu Canal VIP Exclusivo:*\n{link}\n\n⚠️ *Importante:* Este enlace es personal y de 1 solo uso.'
            await send_message(client, uid, client_msg)
            await send_message(client, ADMIN_TELEGRAM_ID, f'✅ *Cliente @{uname} (ID: {uid}) APROBADO y activado en el Canal VIP con éxito.*')
        elif data.startswith('reject_'):
            parts = data.split('_')
            uid = parts[1]
            uname = parts[2] if len(parts) > 2 else 'cliente'
            await send_message(client, uid, '❌ *COMPROBANTE NO PUDO SER VERIFICADO*\n━━━━━━━━━━━━━━━━━━━━━\nNo pudimos validar tu comprobante. Por favor verifica el monto y fecha o reenvía una captura clara.')
            await send_message(client, ADMIN_TELEGRAM_ID, f'❌ *Pago de @{uname} (ID: {uid}) fue RECHAZADO.*')

    elif 'message' in update:
        msg = update['message']
        chat_id = msg['chat']['id']
        from_u = msg.get('from', {})
        uid = from_u.get('id')
        uname = from_u.get('first_name', 'Cliente')
        username = from_u.get('username', str(uid))

        if 'photo' in msg:
            fid = msg['photo'][-1]['file_id']
            await send_message(client, chat_id, '📩 *¡Comprobante de pago recibido!*\n\nEstamos validando tu pago con el administrador. Te enviaremos tu enlace VIP en breve.')
            caption = f'🔔 *NUEVO COMPROBANTE RECIBIDO*\n━━━━━━━━━━━━━━━━━━━━━\n👤 *Cliente:* @{username} ({uname})\n🆔 *ID:* `{uid}`\n📅 *Fecha:* Hoy\n━━━━━━━━━━━━━━━━━━━━━\n👇 *Presiona un botón para validar el acceso VIP:*'
            await forward_photo_to_admin(client, fid, caption, uid, username)
            return

        text = msg.get('text', '').strip()
        if text.startswith('/start') or text.lower() in ['hola', 'buenas', 'buenos dias', 'buenas tardes']:
            txt = f'👋 ¡Hola {uname}! Bienvenido a *FIJAS IA — Soporte & Ventas VIP* ⚽🤖\n\nSomos la primera plataforma de *Inteligencia Deportiva Cuantitativa (+EV)*.\n\n¿En qué te puedo ayudar hoy? Selecciona una opción:'
            await send_message(client, chat_id, txt, get_main_menu())
        elif any(k in text.lower() for k in ['yape', 'plin', 'pagar', 'precio', 'precios', 'planes', 'vip', 'comprar', 'cuenta', 'numero']):
            txt = '👑 *MEMBRESÍAS VIP — FIJAS IA*\n━━━━━━━━━━━━━━━━━━━━━\n⚡ *Pase Semanal (Prueba):* *S/ 19.90* *(o $5 USDT)*\n👑 *Pase Mensual VIP:* *S/ 39.90* *(o $12 USDT)* ⭐ *(Más vendido)*\n💎 *Pase Trimestral (3 Meses):* *S/ 89.90* *(o $25 USDT)*\n\n📲 *YAPE / PLIN:* `901326470` *(BRAY YUSMAN QUISPE ATAO)*\n🟡 *BINANCE PAY ID:* `849201948`\n━━━━━━━━━━━━━━━━━━━━━\n👉 Una vez hecho el pago, envía tu comprobante por este chat para activar tu VIP.'
            await send_message(client, chat_id, txt, get_main_menu())
        else:
            ai_reply = await generate_gemini_reply(text)
            await send_message(client, chat_id, ai_reply, get_main_menu())

async def run_bot():
    logger.info('Iniciando Agente Automático de Soporte @SoporteFijasIA_bot...')
    offset = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f'{BASE_URL}/getMe')
        if r.status_code != 200:
            logger.error(f'Error getMe: {r.text}')
            return
        bot_name = r.json().get('result', {}).get('username', 'SoporteBot')
        logger.info(f'Bot activo: @{bot_name}')
        while True:
            try:
                params = {'timeout': 20}
                if offset is not None:
                    params['offset'] = offset
                resp = await client.get(f'{BASE_URL}/getUpdates', params=params, timeout=25.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get('ok'):
                        for update in data.get('result', []):
                            offset = update['update_id'] + 1
                            await process_update(client, update)
                else:
                    await asyncio.sleep(2)
            except Exception as e:
                logger.error(f'Polling error: {e}')
                await asyncio.sleep(3)

if __name__ == '__main__':
    asyncio.run(run_bot())
