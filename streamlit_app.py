"""
Maquina de Predicciones de Futbol
=================================
Dashboard Streamlit que combina:
  - API-Football (RapidAPI) para datos en vivo de ligas de todo el mundo.
  - Modelo de Poisson para xG y probabilidades base.
  - Google Gemini 1.5 Flash para razonamiento y recomendaciones.
  - Modulo de Value Betting para detectar +EV vs cuotas reales.

Listo para desplegar en Streamlit Community Cloud.

Disclaimer: herramienta educativa. No es consejo financiero.
Las apuestas implican riesgo. Apuesta solo lo que puedas permitirte perder.
"""
from __future__ import annotations

from datetime import datetime

import pandas as pd
import streamlit as st

from analisis import poisson, value_betting
from datos import football_api as api
from ia import gemini_analyzer

# -------------------- CONFIG GLOBAL DE STREAMLIT (DEBE SER PRIMERO) ----------------------
st.set_page_config(
    page_title="FIJAS IA — Panel Cuantitativo Maestro",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="expanded",
)

# -------------------- SEGURIDAD: LOGIN ADMINISTRATIVO ----------------------
def check_admin_auth() -> bool:
    """Verifica credenciales de Administrador para proteger el panel privado."""
    try:
        admin_user = st.secrets.get("ADMIN_USER", "admin")
        admin_pass = st.secrets.get("ADMIN_PASSWORD", "FijasIA2026*")
    except Exception:
        admin_user = "admin"
        admin_pass = "FijasIA2026*"

    if "auth_ok" not in st.session_state:
        st.session_state["auth_ok"] = False

    if not st.session_state["auth_ok"]:
        st.header("🔒 FIJAS IA — Acceso Administrativo")
        st.caption("Área restringida para el Administrador Cuantitativo.")
        
        with st.form("login_form"):
            u = st.text_input("Usuario Administrador", placeholder="admin")
            p = st.text_input("Contraseña de Seguridad", type="password", placeholder="••••••••")
            submitted = st.form_submit_button("Ingresar al Panel de Control", use_container_width=True)
            if submitted:
                if u == admin_user and p == admin_pass:
                    st.session_state["auth_ok"] = True
                    st.rerun()
                else:
                    st.error("Credenciales incorrectas. Acceso denegado.")
        return False
    return True

if not check_admin_auth():
    st.stop()



# CSS extra para refinar el dark mode (el theme base ya viene de config.toml)
st.markdown(
    """
    <style>
        .main-header {
            background: linear-gradient(90deg, #00E5A0 0%, #00B8FF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 2.4rem;
            font-weight: 800;
            margin-bottom: 0;
        }
        .sub-header { color: #888; margin-top: 0; font-size: 0.95rem; }
        .metric-card {
            background-color: #1A1F2C;
            padding: 1rem;
            border-radius: 0.75rem;
            border-left: 4px solid #00E5A0;
        }
        .badge-valor {
            background-color: #00E5A0;
            color: #0E1117;
            padding: 0.2rem 0.6rem;
            border-radius: 0.4rem;
            font-weight: 700;
            font-size: 0.85rem;
        }
        .disclaimer {
            background-color: #2A1F1F;
            border-left: 4px solid #FF4B4B;
            padding: 0.8rem 1rem;
            border-radius: 0.4rem;
            font-size: 0.85rem;
            color: #FFB4B4;
        }
        div[data-testid="stDataFrame"] { border-radius: 0.5rem; }
    </style>
    """,
    unsafe_allow_html=True,
)

# -------------------- CABECERA ----------------------------------------

st.markdown('<p class="main-header">⚽ MAQUINA DE PREDICCIONES DE FUTBOL</p>', unsafe_allow_html=True)
st.markdown(
    '<p class="sub-header">Poisson + Forma Reciente + Gemini 1.5 Flash + Value Betting</p>',
    unsafe_allow_html=True,
)

# -------------------- SIDEBAR: SELECCION DE PARTIDO -------------------

with st.sidebar:
    st.header("🎯 Selecciona un partido")

    temporada_actual = datetime.now().year
    # Si estamos en enero-junio, la temporada europea sigue siendo la del ano anterior
    if datetime.now().month < 7:
        temporada_actual -= 1

    temporada = st.number_input(
        "Temporada", min_value=2015, max_value=temporada_actual + 1,
        value=temporada_actual, step=1,
    )

    # 1. Cargar ligas
    pais_filtro = st.text_input(
        "Filtrar por pais (opcional)", placeholder="Ej: Spain, England, Argentina"
    )

    with st.spinner("Cargando ligas..."):
        ligas = api.listar_ligas(temporada=temporada, pais=pais_filtro or None)

    if not ligas:
        st.warning(
            "No se encontraron ligas. Revisa tu API key o el filtro de pais."
        )
        st.stop()

    opciones_liga = {
        f"{liga['league']['name']} ({liga['country']['name']})": liga
        for liga in ligas
    }
    nombre_liga = st.selectbox("Liga", list(opciones_liga.keys()))
    liga_sel = opciones_liga[nombre_liga]
    liga_id = liga_sel["league"]["id"]
    pais_liga = liga_sel["country"]["name"]

    st.divider()

    # 2. Cargar proximos partidos
    proximos = api.obtener_proximos_partidos(liga_id, temporada, cantidad=20)
    if not proximos:
        st.info(
            "No hay proximos partidos programados en esta liga/temporada. "
            "Prueba otra liga."
        )
        st.stop()

    opciones_partido = {
        f"{p['teams']['home']['name']} vs {p['teams']['away']['name']}  "
        f"({p['fixture']['date'][:16].replace('T', ' ')})": p
        for p in proximos
    }
    nombre_partido = st.selectbox("Partido", list(opciones_partido.keys()))
    partido = opciones_partido[nombre_partido]

    st.divider()
    st.caption(
        "💡 Las consultas se cachean en memoria. Repetir el mismo "
        "partido NO consume creditos extra de la API."
    )

# -------------------- DATOS DEL PARTIDO SELECCIONADO -------------------

equipo_local = partido["teams"]["home"]
equipo_visit = partido["teams"]["away"]
fixture_id = partido["fixture"]["id"]

col_a, col_b, col_c = st.columns([2, 1, 2])
with col_a:
    st.subheader(f"🏠 {equipo_local['name']}")
with col_b:
    st.markdown(
        f"<h2 style='text-align:center; color:#00E5A0;'>VS</h2>",
        unsafe_allow_html=True,
    )
    st.caption(f"📅 {partido['fixture']['date'][:16].replace('T', ' ')}")
with col_c:
    st.subheader(f"✈️ {equipo_visit['name']}")

# -------------------- TABLA DE POSICIONES -----------------------------

st.markdown("### 📊 Tabla de posiciones")
clasificacion = api.obtener_clasificacion(liga_id, temporada)

if clasificacion:
    filas = []
    for fila in clasificacion:
        filas.append(
            {
                "Pos": fila.get("rank"),
                "Equipo": fila["team"]["name"],
                "PJ": fila["all"]["played"],
                "PG": fila["all"]["win"],
                "PE": fila["all"]["draw"],
                "PP": fila["all"]["lose"],
                "GF": fila["all"]["goals"]["for"],
                "GC": fila["all"]["goals"]["against"],
                "DG": fila["goalsDiff"],
                "Pts": fila.get("points"),
                "Forma": fila.get("form", ""),
            }
        )
    df_clas = pd.DataFrame(filas)

    # Resaltar equipos del partido
    def _resaltar(row):
        if row["Equipo"] in (equipo_local["name"], equipo_visit["name"]):
            return ["background-color: #1A3A2C"] * len(row)
        return [""] * len(row)

    st.dataframe(
        df_clas.style.apply(_resaltar, axis=1),
        use_container_width=True,
        hide_index=True,
        height=400,
    )
else:
    st.info("Tabla de posiciones no disponible para esta liga.")

# -------------------- ESTADISTICAS DE LOS DOS EQUIPOS -----------------

st.markdown("### 📈 Estadisticas comparativas")

stats_local = api.estadisticas_equipo(equipo_local["id"], liga_id, temporada)
stats_visit = api.estadisticas_equipo(equipo_visit["id"], liga_id, temporada)

prom_local = api.extraer_promedios_goles(stats_local)
prom_visit = api.extraer_promedios_goles(stats_visit)
forma_local = api.extraer_forma(stats_local)
forma_visit = api.extraer_forma(stats_visit)

col1, col2 = st.columns(2)

with col1:
    st.markdown(f"#### 🏠 {equipo_local['name']}")
    st.markdown(f"**Forma reciente:** `{forma_local or 'N/D'}`")
    metricas_local = pd.DataFrame(
        [
            ["Goles a favor (general)", f"{prom_local['goles_favor_total']:.2f}"],
            ["Goles a favor (en casa)", f"{prom_local['goles_favor_local']:.2f}"],
            ["Goles en contra (general)", f"{prom_local['goles_contra_total']:.2f}"],
            ["Goles en contra (en casa)", f"{prom_local['goles_contra_local']:.2f}"],
        ],
        columns=["Metrica", "Promedio"],
    )
    st.dataframe(metricas_local, use_container_width=True, hide_index=True)

with col2:
    st.markdown(f"#### ✈️ {equipo_visit['name']}")
    st.markdown(f"**Forma reciente:** `{forma_visit or 'N/D'}`")
    metricas_visit = pd.DataFrame(
        [
            ["Goles a favor (general)", f"{prom_visit['goles_favor_total']:.2f}"],
            ["Goles a favor (fuera)", f"{prom_visit['goles_favor_visitante']:.2f}"],
            ["Goles en contra (general)", f"{prom_visit['goles_contra_total']:.2f}"],
            ["Goles en contra (fuera)", f"{prom_visit['goles_contra_visitante']:.2f}"],
        ],
        columns=["Metrica", "Promedio"],
    )
    st.dataframe(metricas_visit, use_container_width=True, hide_index=True)

# -------------------- ULTIMOS 5 PARTIDOS DE CADA EQUIPO ---------------

st.markdown("### 🕒 Ultimos 5 partidos")

def _resumen_ultimos(equipo_id: int, equipo_nombre: str) -> tuple[pd.DataFrame, str]:
    partidos = api.ultimos_partidos_equipo(equipo_id, cantidad=5)
    filas = []
    resumen_texto_lineas = []
    for p in partidos:
        local_n = p["teams"]["home"]["name"]
        visit_n = p["teams"]["away"]["name"]
        gl = p["goals"]["home"]
        gv = p["goals"]["away"]
        es_local = local_n == equipo_nombre
        gf = gl if es_local else gv
        gc = gv if es_local else gl
        rival = visit_n if es_local else local_n
        filas.append(
            {
                "Fecha": p["fixture"]["date"][:10],
                "Sitio": "Local" if es_local else "Visitante",
                "Rival": rival,
                "GF": gf,
                "GC": gc,
                "Resultado": "G" if (gf or 0) > (gc or 0) else ("E" if gf == gc else "P"),
            }
        )
        resumen_texto_lineas.append(
            f"  - {p['fixture']['date'][:10]} vs {rival} "
            f"({'Local' if es_local else 'Visitante'}): {gf}-{gc}"
        )
    return pd.DataFrame(filas), "\n".join(resumen_texto_lineas)


col_l, col_v = st.columns(2)
with col_l:
    st.markdown(f"**🏠 {equipo_local['name']}**")
    df_ult_local, resumen_txt_local = _resumen_ultimos(equipo_local["id"], equipo_local["name"])
    if not df_ult_local.empty:
        st.dataframe(df_ult_local, use_container_width=True, hide_index=True)
    else:
        st.info("Sin datos recientes.")

with col_v:
    st.markdown(f"**✈️ {equipo_visit['name']}**")
    df_ult_visit, resumen_txt_visit = _resumen_ultimos(equipo_visit["id"], equipo_visit["name"])
    if not df_ult_visit.empty:
        st.dataframe(df_ult_visit, use_container_width=True, hide_index=True)
    else:
        st.info("Sin datos recientes.")

# -------------------- BOTON: GENERAR ANALISIS IA ----------------------

st.markdown("---")
st.markdown("### 🤖 Analisis IA")

col_btn1, col_btn2 = st.columns([1, 3])
with col_btn1:
    generar = st.button(
        "🧠 GENERAR ANALISIS IA",
        type="primary",
        use_container_width=True,
    )
with col_btn2:
    st.caption(
        "El boton ejecuta: 1) Modelo Poisson  →  2) Razonamiento Gemini "
        "→  3) Deteccion de Value Betting"
    )

if generar:
    # ---- 1. Promedio goles de la liga (aproximado) ----
    if clasificacion:
        total_goles = sum(
            (f["all"]["goals"]["for"] or 0) for f in clasificacion
        )
        total_partidos = sum(
            (f["all"]["played"] or 0) for f in clasificacion
        )
        media_liga_total = (total_goles / total_partidos) if total_partidos else 2.6
    else:
        media_liga_total = 2.6

    media_liga_local = media_liga_total * 0.55      # ~55% goles los hace el local
    media_liga_visit = media_liga_total * 0.45

    # ---- 2. Analisis Poisson ----
    poisson_data = poisson.analisis_completo(
        goles_local=prom_local,
        goles_visit=prom_visit,
        media_liga_local=media_liga_local,
        media_liga_visitante=media_liga_visit,
    )

    # ---- 3. Cuotas (opcional) ----
    cuotas_raw = api.cuotas_partido(fixture_id)
    cuotas = api.extraer_cuotas_1x2(cuotas_raw)

    # ---- 4. Posiciones de los dos equipos ----
    pos_local = pos_visit = None
    if clasificacion:
        for fila in clasificacion:
            if fila["team"]["name"] == equipo_local["name"]:
                pos_local = fila.get("rank")
            if fila["team"]["name"] == equipo_visit["name"]:
                pos_visit = fila.get("rank")

    # ---- 5. Construir dossier para Gemini ----
    dossier = {
        "liga": {
            "nombre": liga_sel["league"]["name"],
            "pais": pais_liga,
            "temporada": temporada,
            "promedio_goles": round(media_liga_total, 2),
        },
        "local": {
            "nombre": equipo_local["name"],
            "posicion": pos_local,
            "forma": forma_local,
            "stats": prom_local,
            "ultimos_partidos_resumen": resumen_txt_local or "  N/D",
        },
        "visitante": {
            "nombre": equipo_visit["name"],
            "posicion": pos_visit,
            "forma": forma_visit,
            "stats": prom_visit,
            "ultimos_partidos_resumen": resumen_txt_visit or "  N/D",
        },
        "poisson": poisson_data,
        "cuotas": cuotas,
    }

    # ---- 6. Llamar a Gemini ----
    with st.spinner("🧠 Gemini esta razonando sobre el partido..."):
        analisis = gemini_analyzer.analizar_partido(dossier)

    if "error" in analisis:
        st.error(f"❌ {analisis['error']}")
        if "detalle" in analisis:
            st.code(analisis["detalle"])
        st.stop()

    # ---- 7. RENDERIZAR RESULTADO ----
    st.success("✅ Analisis generado con exito")

    # --- Marcador exacto y confianza global ---
    marc = analisis.get("marcador_exacto", {})
    st.markdown("#### 🎯 Marcador exacto mas probable")

    mc1, mc2, mc3 = st.columns([1, 1, 1])
    with mc1:
        st.metric(
            label=f"🏠 {equipo_local['name']}",
            value=marc.get("local", "?"),
        )
    with mc2:
        st.metric(
            label="Confianza",
            value=f"{marc.get('confianza_pct', 0):.1f}%",
        )
    with mc3:
        st.metric(
            label=f"✈️ {equipo_visit['name']}",
            value=marc.get("visitante", "?"),
        )

    confianza = analisis.get("nivel_confianza_global", "MEDIO")
    color = {"ALTO": "🟢", "MEDIO": "🟡", "BAJO": "🔴"}.get(confianza, "⚪")
    st.info(f"{color} Nivel de confianza global: **{confianza}**")

    # --- Probabilidades 1X2 ---
    st.markdown("#### 📊 Probabilidades 1X2")
    p1x2 = analisis.get("probabilidades_1x2", {})
    pcol1, pcol2, pcol3 = st.columns(3)
    pcol1.metric("Victoria Local (1)", f"{p1x2.get('local_pct', 0):.1f}%")
    pcol2.metric("Empate (X)", f"{p1x2.get('empate_pct', 0):.1f}%")
    pcol3.metric("Victoria Visitante (2)", f"{p1x2.get('visitante_pct', 0):.1f}%")

    # Comparativa Poisson vs Gemini
    with st.expander("🔍 Ver comparativa Poisson puro vs IA ajustada"):
        comp = pd.DataFrame(
            [
                ["Local", f"{poisson_data['probabilidades_1x2']['local']*100:.1f}%",
                 f"{p1x2.get('local_pct', 0):.1f}%"],
                ["Empate", f"{poisson_data['probabilidades_1x2']['empate']*100:.1f}%",
                 f"{p1x2.get('empate_pct', 0):.1f}%"],
                ["Visitante", f"{poisson_data['probabilidades_1x2']['visitante']*100:.1f}%",
                 f"{p1x2.get('visitante_pct', 0):.1f}%"],
            ],
            columns=["Resultado", "Poisson puro", "IA ajustada (Gemini)"],
        )
        st.dataframe(comp, use_container_width=True, hide_index=True)

    # --- Recomendaciones de apuesta ---
    st.markdown("#### 💡 Recomendaciones de apuesta")
    recs = analisis.get("recomendaciones", [])
    if recs:
        for r in recs:
            with st.container(border=True):
                rcol1, rcol2 = st.columns([3, 1])
                with rcol1:
                    st.markdown(f"**{r.get('mercado', 'N/D')}**")
                    st.caption(r.get("justificacion", ""))
                with rcol2:
                    st.metric("Confianza", f"{r.get('confianza_pct', 0):.0f}%")
    else:
        st.info("No hay recomendaciones suficientemente solidas.")

    # --- Oportunidades de Valor ---
    st.markdown("#### 💰 Oportunidades de Value Betting")
    if cuotas:
        # Combinamos lo que diga Gemini con nuestro propio calculo
        prob_modelo = {
            "local": p1x2.get("local_pct", 0) / 100,
            "empate": p1x2.get("empate_pct", 0) / 100,
            "visitante": p1x2.get("visitante_pct", 0) / 100,
        }
        oportunidades_calc = value_betting.buscar_oportunidades_1x2(
            prob_modelo, cuotas, umbral_ev=0.05
        )

        if oportunidades_calc:
            st.markdown(
                f'<span class="badge-valor">+EV DETECTADO</span> '
                f'Margen del bookie: {value_betting.margen_bookie(cuotas)}%',
                unsafe_allow_html=True,
            )
            for op in oportunidades_calc:
                kelly = value_betting.kelly_fraccion(op.prob_modelo, op.cuota)
                with st.container(border=True):
                    c1, c2, c3, c4, c5 = st.columns([2, 1, 1, 1, 1])
                    c1.markdown(f"**{op.mercado}**")
                    c2.metric("Cuota", f"{op.cuota:.2f}")
                    c3.metric("Prob. modelo", f"{op.prob_modelo*100:.1f}%")
                    c4.metric("Edge", f"{op.edge:+.1f}%")
                    c5.metric("Kelly 1/4", f"{kelly:.1f}%")
        else:
            st.info("No se detectaron apuestas con valor positivo claro.")

        # Comentarios extra de Gemini sobre oportunidades de valor
        oportunidades_ia = analisis.get("oportunidades_valor", [])
        if oportunidades_ia:
            with st.expander("Comentarios adicionales de la IA sobre valor"):
                for op in oportunidades_ia:
                    st.markdown(
                        f"- **{op.get('mercado')}** | cuota {op.get('cuota_bookie')} "
                        f"| edge {op.get('edge_pct')}%  \n"
                        f"  _{op.get('comentario', '')}_"
                    )
    else:
        st.warning(
            "No hay cuotas disponibles para este partido en tu plan de RapidAPI. "
            "El analisis de valor requiere acceso a /odds."
        )

    # --- Razonamiento tactico ---
    st.markdown("#### 🧠 Razonamiento tactico")
    with st.container(border=True):
        st.markdown(analisis.get("razonamiento_tactico", "_Sin analisis tactico._"))

    # --- Advertencias del modelo ---
    if analisis.get("advertencia"):
        st.warning(f"⚠️ {analisis['advertencia']}")

# -------------------- DISCLAIMER FINAL --------------------------------

st.markdown("---")
st.markdown(
    """
    <div class="disclaimer">
    <strong>⚠️ Aviso importante:</strong> Esta herramienta es educativa y experimental.
    Las predicciones se basan en modelos estadisticos y razonamiento de IA, pero
    el futbol es impredecible. <strong>No es consejo financiero ni recomendacion
    de apuesta.</strong> Apuesta solo lo que puedas permitirte perder. Si crees
    que tienes un problema con el juego, busca ayuda en
    <a href="https://www.jugarbien.es" style="color:#FFB4B4;">jugarbien.es</a>
    o en la linea de tu pais.
    </div>
    """,
    unsafe_allow_html=True,
)

st.caption(
    "Construido con Streamlit · Datos: API-Football (RapidAPI) · "
    "IA: Google Gemini 1.5 Flash · Modelo matematico: Distribucion de Poisson"
)
