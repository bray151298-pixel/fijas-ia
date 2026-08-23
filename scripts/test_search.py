import httpx
import re
from urllib.parse import quote_plus

def test_google(query):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "es-PE,es;q=0.9,es-419;q=0.8,en;q=0.7",
    }
    url = f"https://www.google.com/search?q={quote_plus(query)}"
    r = httpx.get(url, headers=headers, timeout=10.0)
    print("Google status:", r.status_code)
    
    # Check for text in Google response
    spans = re.findall(r'<div[^>]*aria-label="([^"]*)"', r.text)
    print("Aria labels:", spans[:10])
    
    text = re.sub(r'<[^<]+?>', ' ', r.text)
    text = ' '.join(text.split())
    
    # Search for keywords
    keywords = ["Chankas", "Universitario", "Clausura", "Jornada", "Mañana", "6:30", "vs"]
    for kw in keywords:
        if kw.lower() in text.lower():
            idx = text.lower().find(kw.lower())
            print(f"[{kw}] -> {text[max(0, idx-40):min(len(text), idx+100)]}")

if __name__ == "__main__":
    test_google("Club Universitario de Deportes")
