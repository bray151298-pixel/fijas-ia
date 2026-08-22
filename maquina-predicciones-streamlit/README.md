# Máquina de Predicciones de Fútbol

Dashboard Streamlit que combina un modelo de **Distribución de Poisson** con **Google Gemini 1.5 Flash** para analizar partidos de fútbol de cualquier liga del mundo y detectar **oportunidades de valor** (Value Betting) frente a las cuotas de las casas de apuestas.

> **Aviso:** herramienta educativa y experimental. No es consejo financiero. Apuesta solo lo que puedas permitirte perder.

---

## Características

- **Datos en vivo** de cualquier liga vía API-Football (RapidAPI).
- **Caché en memoria** con `st.cache_data` para no quemar el cupo gratuito.
- **Modelo Poisson** para xG, marcador exacto, 1X2, Over/Under y BTTS.
- **Gemini 1.5 Flash** como cerebro: razona sobre Poisson + forma reciente + contexto de liga y devuelve recomendaciones estructuradas en JSON.
- **Value Betting**: compara la probabilidad del modelo contra la cuota del bookie y detecta apuestas con +EV; sugiere tamaño de apuesta vía Kelly fraccional.
- **Dashboard Dark Mode** con tabla de posiciones, comparativa de equipos, últimos 5 partidos y panel de IA.

---

## Stack

| Capa | Tecnología | Coste |
|---|---|---|
| Frontend + lógica | Streamlit | Gratis |
| IA | Google Gemini 1.5 Flash | Tier gratis generoso |
| Datos | API-Football (RapidAPI) | Tier gratis 100 req/día |
| Matemáticas | scipy (Poisson), numpy, pandas | Gratis |
| Hosting | Streamlit Community Cloud | Gratis |

---

## Estructura del proyecto

```
maquina-predicciones-streamlit/
├── app.py                       # Dashboard Streamlit principal
├── requirements.txt
├── .gitignore
├── .streamlit/
│   ├── config.toml              # Tema dark mode
│   └── secrets.toml.example     # Plantilla de claves
├── ia/
│   └── gemini_analyzer.py       # Cliente Gemini + prompt experto
├── datos/
│   └── football_api.py          # Wrapper API-Football con caché
└── analisis/
    ├── poisson.py               # Modelo Poisson + xG + 1X2 + O/U + BTTS
    └── value_betting.py         # Detección de +EV + Kelly fraccional
```

---

## Instalación local

### 1. Clonar y entrar

```bash
git clone <tu_repo>
cd maquina-predicciones-streamlit
```

### 2. Entorno virtual

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Mac / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar claves de API

Copia la plantilla de secrets:

```bash
# Windows
copy .streamlit\secrets.toml.example .streamlit\secrets.toml
# Mac / Linux
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
```

Edita `.streamlit/secrets.toml`:

```toml
GEMINI_API_KEY = "tu_clave_de_google_ai_studio"
RAPIDAPI_KEY   = "tu_clave_de_rapidapi"
```

### Cómo obtener las claves (gratis)

- **Gemini API Key**: https://aistudio.google.com/app/apikey → "Create API Key" → copia y pega.
- **API-Football (RapidAPI)**: https://rapidapi.com/api-sports/api/api-football → botón "Subscribe to Test" → elige el plan **Basic (Free)**. Tu clave aparece en el header `X-RapidAPI-Key` de los ejemplos.

### 4. Lanzar la app

```bash
streamlit run app.py
```

Se abre en `http://localhost:8501`.

---

## Despliegue en Streamlit Community Cloud

1. Sube el repo a GitHub (asegúrate de que `secrets.toml` está en `.gitignore`).
2. Entra en https://share.streamlit.io y haz login con GitHub.
3. "New app" → selecciona repo, branch (`main`) y archivo principal (`app.py`).
4. En **Advanced settings → Secrets**, pega:

   ```toml
   GEMINI_API_KEY = "tu_clave"
   RAPIDAPI_KEY   = "tu_clave"
   ```

5. "Deploy" → en 1-2 min tienes URL pública gratis.

---

## Cómo funciona el motor de predicción

### Paso 1: Datos crudos
Para el partido seleccionado se descargan: estadísticas de temporada, rendimiento local/visitante de cada equipo, forma reciente (string tipo `WWDLW`), últimos 5 partidos y, si está disponible, las cuotas del bookie.

### Paso 2: Modelo Poisson
A partir del promedio de goles a favor y en contra (ajustado por la media de la liga) se calculan los goles esperados (xG) de cada equipo y, a partir de ellos, la probabilidad de cada marcador exacto entre 0-0 y 6-6. De ahí salen las probabilidades 1X2, Over/Under y BTTS.

### Paso 3: Razonamiento Gemini
Toda esa información se empaqueta en un dossier que se envía a Gemini 1.5 Flash con un *system prompt* de analista experto. Gemini ajusta los números crudos según contexto (forma reciente, tipo de liga goleadora vs cerrada) y devuelve un JSON con marcador, probabilidades ajustadas y recomendaciones.

### Paso 4: Value Betting
Si hay cuotas, se compara `prob_modelo × cuota` contra 1. Si el resultado es > 1.05, hay valor positivo. Se sugiere también el tamaño de apuesta usando el criterio de Kelly fraccional (1/4) para limitar varianza.

---

## Caché y consumo de API

Cada endpoint de API-Football tiene un TTL distinto:

- Ligas y plantillas: 24h
- Clasificaciones y stats de equipo: 6h
- Fixtures y cuotas: 30 min

Esto significa que si analizas el mismo partido varias veces seguidas, **no consumes créditos extra**. El tier gratuito (100 req/día) llega de sobra para uso personal moderado.

---

## Roadmap / ideas para añadir

- Persistir histórico de predicciones y trackear ROI.
- Añadir mercados Hándicap Asiático y Total de Córners.
- Modelo Dixon-Coles completo (corrección para marcadores bajos).
- Notificaciones cuando aparece +EV alto (Telegram bot).
- Versión móvil PWA instalable.

---

## Licencia

Uso personal y educativo.
