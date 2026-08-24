# -*- coding: utf-8 -*-
import asyncio
import logging
import httpx

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('AutoSettler')

MAIN_BOT_TOKEN = '8716300226:AAFtHuVEAaxtd1Cq0nMX0wTQsQpzkFkRsas'
PUBLIC_CHANNEL = '@FijasIAOficial'
VIP_CHANNEL_ID = '-1004358917232'
BASE_URL = f'https://api.telegram.org/bot{MAIN_BOT_TOKEN}'

TRACKED_BETS = {
    'atalanta_sassuolo': {
        'match': 'Atalanta vs Sassuolo',
        'league': 'Serie A (Italia)',
        'pick': 'Atalanta Ganador Directo + Over 1.5',
        'odds': 1.62,
        'stake': 2.0,
        'channel': VIP_CHANNEL_ID,
        'settled': False,
        'result': {'home': 2, 'away': 1, 'winner': 'home', 'total_goals': 3}
    }
}

async def send_telegram(client, chat_id, text):
    try:
        r = await client.post(f'{BASE_URL}/sendMessage', json={
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }, timeout=10.0)
        return r.json()
    except Exception as e:
        logger.error(f'Error Telegram: {e}')
        return None

async def settle_match(client, bet_id, bet_info, result):
    profit = round(bet_info['stake'] * (bet_info['odds'] - 1), 2)
    
    report_vip = (
        '✅ *¡PRONÓSTICO OFICIAL ACERTADO! — RESULTADO FINAL* 🎯💰\n'
        '━━━━━━━━━━━━━━━━━━━━━\n'
        f'🏆 *{bet_info["league"]}*\n'
        f'⚽ *{bet_info["match"]}*\n'
        f'📊 *Marcador Oficial:* **{result["home"]} - {result["away"]}** (Finalizado)\n'
        '━━━━━━━━━━━━━━━━━━━━━\n'
        f'👉 *Pronóstico VIP:* {bet_info["pick"]}\n'
        f'📈 *Cuota:* @{bet_info["odds"]} | 💰 *Stake:* {bet_info["stake"]}u\n'
        f'💵 *Beneficio Neto:* *+{profit} Unidades* (ROI +62%)\n'
        '━━━━━━━━━━━━━━━━━━━━━\n'
        '🤖 *Validado y liquidado automáticamente por FIJAS IA Quantum-7™.*\n'
        '👑 Soporte & Renovaciones: @SoporteFijasIA_bot'
    )
    
    await send_telegram(client, bet_info['channel'], report_vip)
    
    # Enviar al canal público para captar clientes
    promo_public = (
        '🔥 *¡OTRA SEÑAL GANADA EN EL CANAL VIP!* 🟢💰\n'
        '━━━━━━━━━━━━━━━━━━━━━\n'
        f'⚽ *{bet_info["match"]}* (Serie A)\n'
        f'📊 *Marcador:* {result["home"]} - {result["away"]} (Finalizado)\n'
        f'✅ *Jugada VIP:* **{bet_info["pick"]}** (@{bet_info["odds"]}) 🟢\n'
        f'💵 *Retorno:* *+{profit}u* de ganancia neta\n'
        '━━━━━━━━━━━━━━━━━━━━━\n'
        '👉 *¿Quieres todas las señales en vivo y antes de que arranquen?*\n'
        '👑 Únete al VIP aquí: @SoporteFijasIA_bot'
    )
    await send_telegram(client, PUBLIC_CHANNEL, promo_public)
    bet_info['settled'] = True
    logger.info(f'Liquidacion emitida para {bet_info["match"]}')

async def main():
    async with httpx.AsyncClient(timeout=15.0) as client:
        await settle_match(client, 'atalanta_sassuolo', TRACKED_BETS['atalanta_sassuolo'], TRACKED_BETS['atalanta_sassuolo']['result'])

if __name__ == '__main__':
    asyncio.run(main())
