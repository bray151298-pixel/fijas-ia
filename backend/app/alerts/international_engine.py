# -*- coding: utf-8 -*-
"""
FIJAS IA QUANTUM-7™ — MOTOR CUANTITATIVO GLOBAL & AUTO-LIQUIDADOR 24/7
=====================================================================
Cobertura Internacional:
- Fútbol: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions, Libertadores, Liga 1 Perú, Brasileirão, Argentina, Liga MX, MLS.
- Básquetbol: NBA.
- Béisbol: MLB.
- Tenis: ATP / WTA.
"""
import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
import httpx

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger('QuantumEngine')

# Credenciales y Canales
MAIN_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', os.getenv('MAIN_BOT_TOKEN', ''))
SUPPORT_BOT_TOKEN = os.getenv('SUPPORT_BOT_TOKEN', '')
PUBLIC_CHANNEL = '@FijasIAOficial'
VIP_CHANNEL_ID = '-1004358917232'
ADMIN_TELEGRAM_ID = os.getenv('ADMIN_TELEGRAM_ID', '')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')

BASE_MAIN = f'https://api.telegram.org/bot{MAIN_BOT_TOKEN}'
BASE_SUPPORT = f'https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}'

# APIs de Marcadores Oficiales Internacionales (ESPN Scoreboards)
ESPN_LEAGUES = {
    'per.1': '🇵🇪 Liga 1 Perú',
    'eng.1': '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League',
    'esp.1': '🇪🇸 La Liga (España)',
    'ita.1': '🇮🇹 Serie A (Italia)',
    'ger.1': '🇩🇪 Bundesliga',
    'fra.1': '🇫🇷 Ligue 1',
    'uefa.champions': '🏆 UEFA Champions League',
    'conmebol.libertadores': '🏆 Copa Libertadores',
    'bra.1': '🇧🇷 Brasileirão Serie A',
    'arg.1': '🇦🇷 Liga Profesional Argentina',
    'mex.1': '🇲🇽 Liga MX',
    'usa.1': '🇺🇸 MLS',
}

# Registro en memoria de apuestas y partidos monitoreados
ACTIVE_TRACKING = {}

async def send_telegram(chat_id: str | int, text: str, reply_markup=None, is_support=False):
    base = BASE_SUPPORT if is_support else BASE_MAIN
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    if reply_markup:
        payload['reply_markup'] = reply_markup
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(f'{base}/sendMessage', json=payload)
            return r.json()
    except Exception as e:
        logger.error(f'Error enviando telegram a {chat_id}: {e}')
        return None

async def create_vip_invite_link():
    payload = {'chat_id': VIP_CHANNEL_ID, 'member_limit': 1, 'name': 'VIP Member Auto'}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(f'{BASE_MAIN}/createChatInviteLink', json=payload)
            res = r.json()
            if res.get('ok'):
                return res['result']['invite_link']
    except Exception as e:
        logger.error(f'Error creando invite link: {e}')
    return 'https://t.me/+FijasIA_VIP_Acceso'

async def fetch_international_scores():
    """Consulta marcadores oficiales en vivo de todas las ligas internacionales."""
    scores = {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        for code, name in ESPN_LEAGUES.items():
            url = f'https://site.api.espn.com/apis/site/v2/sports/soccer/{code}/scoreboard'
            try:
                r = await client.get(url)
                if r.status_code == 200:
                    data = r.json()
                    events = data.get('events', [])
                    for ev in events:
                        comp = ev.get('competitions', [{}])[0]
                        competitors = comp.get('competitors', [])
                        if len(competitors) >= 2:
                            home = competitors[0] if competitors[0].get('homeAway') == 'home' else competitors[1]
                            away = competitors[1] if competitors[1].get('homeAway') == 'away' else competitors[0]
                            
                            status_type = ev.get('status', {}).get('type', {})
                            state = status_type.get('state') # pre, in, post
                            is_final = status_type.get('completed', False) or state == 'post'
                            
                            home_score = int(home.get('score', 0)) if home.get('score') else 0
                            away_score = int(away.get('score', 0)) if away.get('score') else 0
                            
                            event_id = ev.get('id')
                            scores[event_id] = {
                                'league': name,
                                'home_team': home.get('team', {}).get('displayName', 'Local'),
                                'away_team': away.get('team', {}).get('displayName', 'Visita'),
                                'home_score': home_score,
                                'away_score': away_score,
                                'is_final': is_final,
                                'state': state,
                                'date': ev.get('date')
                            }
            except Exception as e:
                logger.debug(f'Error leyendo ESPN {code}: {e}')
    return scores

async def monitor_and_settle():
    """Monitorea partidos y liquida resultados automáticamente tras el pitazo final."""
    logger.info('Iniciando monitor de liquidaciones internacionales 24/7...')
    while True:
        try:
            scores = await fetch_international_scores()
            for ev_id, match in scores.items():
                if match['is_final']:
                    # Verificar si tenemos apuestas activas para este partido
                    match_key = f"{match['home_team'].lower()}_{match['away_team'].lower()}"
                    if match_key in ACTIVE_TRACKING and not ACTIVE_TRACKING[match_key]['settled']:
                        bet = ACTIVE_TRACKING[match_key]
                        
                        # Determinar ganador
                        home_win = match['home_score'] > match['away_score']
                        draw = match['home_score'] == match['away_score']
                        over_15 = (match['home_score'] + match['away_score']) >= 2
                        
                        # Liquidar
                        won = False
                        if '1X' in bet['pick'] and (home_win or draw):
                            won = True
                        elif 'Ganador' in bet['pick'] and home_win:
                            won = True
                        elif '-1.5' in bet['pick'] and (match['home_score'] - match['away_score']) >= 2:
                            won = True
                        elif over_15 and (home_win or draw):
                            won = True
                        
                        profit = round(bet['stake'] * (bet['odds'] - 1), 2) if won else -bet['stake']
                        
                        # Emitir reporte al VIP
                        status_emoji = '✅' if won else '❌'
                        status_text = 'PRONÓSTICO ACERTADO' if won else 'PRONÓSTICO NO ACERTADO'
                        
                        vip_msg = (
                            f"{status_emoji} <b>¡{status_text}! — RESULTADO FINAL</b> 🎯\n"
                            f"━━━━━━━━━━━━━━━━━━━━━\n"
                            f"🏆 <b>{match['league']}</b>\n"
                            f"⚽ <b>{match['home_team']} vs {match['away_team']}</b>\n"
                            f"📊 <b>Marcador Oficial:</b> <b>{match['home_score']} - {match['away_score']}</b> (Finalizado)\n"
                            f"━━━━━━━━━━━━━━━━━━━━━\n"
                            f"👉 <b>Selección VIP:</b> {bet['pick']}\n"
                            f"📈 <b>Cuota:</b> @{bet['odds']} | 💰 <b>Stake:</b> {bet['stake']}u\n"
                            f"💵 <b>Balance:</b> <b>{'+' if won else ''}{profit} Unidades</b>\n"
                            f"━━━━━━━━━━━━━━━━━━━━━\n"
                            f"🤖 <i>Liquidado automáticamente por FIJAS IA Quantum-7™.</i>\n"
                            f"👑 Soporte & Renovación: @SoporteFijasIA_bot"
                        )
                        await send_telegram(VIP_CHANNEL_ID, vip_msg)
                        
                        # Si fue ganada, compartir al canal público para captación
                        if won:
                            free_promo = (
                                f"🔥 <b>¡OTRO VERDE EN EL CANAL VIP!</b> 🟢💰\n"
                                f"━━━━━━━━━━━━━━━━━━━━━\n"
                                f"⚽ <b>{match['home_team']} vs {match['away_team']}</b> ({match['league']})\n"
                                f"📊 Marcador: {match['home_score']} - {match['away_score']} (Finalizado)\n"
                                f"✅ <b>Jugada VIP:</b> {bet['pick']} (@{bet['odds']}) 🟢\n"
                                f"💵 <b>Retorno:</b> <b>+{profit}u</b> de ganancia neta\n"
                                f"━━━━━━━━━━━━━━━━━━━━━\n"
                                f"👉 <b>¿Quieres recibir todas las señales VIP en vivo?</b>\n"
                                f"👑 Únete aquí: @SoporteFijasIA_bot"
                            )
                            await send_telegram(PUBLIC_CHANNEL, free_promo)
                        
                        bet['settled'] = True
                        logger.info(f"Partido {match['home_team']} vs {match['away_team']} liquidado. Resultado: {won}")
            
            await asyncio.sleep(60) # Escanear cada 60 segundos
        except Exception as e:
            logger.error(f'Error en ciclo de liquidacion: {e}')
            await asyncio.sleep(30)

async def support_bot_polling():
    """Atiende a los clientes en @SoporteFijasIA_bot con Yape/Plin y aprobación de Bray."""
    logger.info('Iniciando Bot de Soporte @SoporteFijasIA_bot...')
    offset = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            try:
                params = {'timeout': 20}
                if offset is not None:
                    params['offset'] = offset
                resp = await client.get(f'{BASE_SUPPORT}/getUpdates', params=params, timeout=25.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get('ok'):
                        for update in data.get('result', []):
                            offset = update['update_id'] + 1
                            
                            # A) Botones de Aprobación presionados por Bray
                            if 'callback_query' in update:
                                cb = update['callback_query']
                                cb_data = cb.get('data', '')
                                cb_id = cb['id']
                                await client.post(f'{BASE_SUPPORT}/answerCallbackQuery', json={'callback_query_id': cb_id})
                                
                                if cb_data.startswith('approve_'):
                                    parts = cb_data.split('_')
                                    uid = parts[1]
                                    uname = parts[2] if len(parts) > 2 else 'cliente'
                                    invite_link = await create_vip_invite_link()
                                    
                                    client_msg = (
                                        "🎉 <b>¡PAGO VERIFICADO CON ÉXITO! BIENVENIDO AL CANAL VIP</b> 👑🏆\n"
                                        "━━━━━━━━━━━━━━━━━━━━━\n"
                                        "Tu membresía ha sido activada correctamente por el Administrador.\n\n"
                                        "👉 <b>Haz clic aquí para unirte a tu Canal VIP Exclusivo:</b>\n"
                                        f"{invite_link}\n\n"
                                        "⚠️ <b>Importante:</b> Este enlace es personal y de 1 solo uso. ¡Aprovéchalo y bienvenido al equipo ganador!"
                                    )
                                    await send_telegram(uid, client_msg, is_support=True)
                                    await send_telegram(ADMIN_TELEGRAM_ID, f"✅ <b>Cliente @{uname} (ID: {uid}) APROBADO y activado en el Canal VIP con éxito.</b>", is_support=True)
                                
                                elif cb_data.startswith('reject_'):
                                    parts = cb_data.split('_')
                                    uid = parts[1]
                                    uname = parts[2] if len(parts) > 2 else 'cliente'
                                    await send_telegram(uid, "❌ <b>COMPROBANTE NO PUDO SER VERIFICADO</b>\n\nPor favor verifica los datos o reenvía una captura clara.", is_support=True)
                                    await send_telegram(ADMIN_TELEGRAM_ID, f"❌ <b>Pago de @{uname} (ID: {uid}) fue RECHAZADO.</b>", is_support=True)
                            
                            # B) Mensajes y comprobantes
                            elif 'message' in update:
                                msg = update['message']
                                chat_id = msg['chat']['id']
                                from_u = msg.get('from', {})
                                uid = from_u.get('id')
                                uname = from_u.get('first_name', 'Cliente')
                                username = from_u.get('username', str(uid))
                                
                                # Comprobante de pago con foto
                                if 'photo' in msg:
                                    fid = msg['photo'][-1]['file_id']
                                    await send_telegram(chat_id, "📩 <b>¡Comprobante de pago recibido!</b>\n\nEstamos validando tu pago con el administrador. Te enviaremos tu enlace VIP en breve.", is_support=True)
                                    
                                    caption = (
                                        f"🔔 <b>NUEVO COMPROBANTE RECIBIDO</b>\n"
                                        f"━━━━━━━━━━━━━━━━━━━━━\n"
                                        f"👤 <b>Cliente:</b> @{username} ({uname})\n"
                                        f"🆔 <b>ID:</b> <code>{uid}</code>\n"
                                        f"📅 <b>Fecha:</b> Hoy\n"
                                        f"━━━━━━━━━━━━━━━━━━━━━\n"
                                        f"👇 <b>Presiona un botón para validar el acceso VIP:</b>"
                                    )
                                    inline_kb = {
                                        'inline_keyboard': [
                                            [{'text': '✅ APROBAR Y ENVIAR ENLACE VIP', 'callback_data': f'approve_{uid}_{username}'}],
                                            [{'text': '❌ RECHAZAR PAGO', 'callback_data': f'reject_{uid}_{username}'}]
                                        ]
                                    }
                                    await client.post(f'{BASE_SUPPORT}/sendPhoto', json={
                                        'chat_id': ADMIN_TELEGRAM_ID,
                                        'photo': fid,
                                        'caption': caption,
                                        'parse_mode': 'HTML',
                                        'reply_markup': inline_kb
                                    })
                                
                                # Mensajes de texto /start o planes
                                else:
                                    text = msg.get('text', '').strip()
                                    plans_txt = (
                                        f"👋 ¡Hola {uname}! Bienvenido a <b>FIJAS IA — Soporte & Ventas VIP</b> ⚽🤖\n\n"
                                        "👑 <b>MEMBRESÍAS VIP DISPONIBLES:</b>\n"
                                        "━━━━━━━━━━━━━━━━━━━━━\n"
                                        "⚡ <b>Pase Semanal:</b> <b>S/ 19.90</b> (o $5 USDT)\n"
                                        "👑 <b>Pase Mensual VIP:</b> <b>S/ 39.90</b> (o $12 USDT) ⭐ (Más vendido)\n"
                                        "💎 <b>Pase Trimestral:</b> <b>S/ 89.90</b> (o $25 USDT)\n\n"
                                        "📲 <b>YAPE / PLIN:</b> <code>901326470</code> (BRAY YUSMAN QUISPE ATAO)\n"
                                        "🟡 <b>BINANCE PAY ID:</b> <code>849201948</code>\n"
                                        "━━━━━━━━━━━━━━━━━━━━━\n"
                                        "📸 <b>Para activar tu acceso:</b> Envía la captura de tu comprobante por este chat."
                                    )
                                    await send_telegram(chat_id, plans_txt, is_support=True)
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f'Error en support bot: {e}')
                await asyncio.sleep(3)

async def main():
    logger.info('🚀 INICIANDO ECOSISTEMA GLOBAL FIJAS IA 24/7...')
    await asyncio.gather(
        monitor_and_settle(),
        support_bot_polling()
    )

if __name__ == '__main__':
    asyncio.run(main())
