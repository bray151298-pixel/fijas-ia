import httpx

def test_espn_tomorrow():
    url = "https://site.api.espn.com/apis/site/v2/sports/soccer/per.1/scoreboard?dates=20260823"
    r = httpx.get(url, timeout=10.0)
    print("ESPN Status:", r.status_code)
    data = r.json()
    events = data.get("events", [])
    print(f"Total eventos encontrados mañana: {len(events)}")
    for ev in events:
        name = ev.get("name")
        date = ev.get("date")
        status = ev.get("status", {}).get("type", {}).get("description")
        print(f"-> {name} | {date} | {status}")

if __name__ == "__main__":
    test_espn_tomorrow()
