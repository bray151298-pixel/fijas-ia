import httpx
import re
from urllib.parse import quote_plus

def search_live(query: str, max_results: int = 5) -> list[dict]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    }
    results = []
    try:
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            r = client.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=headers)
            if r.status_code == 200:
                snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', r.text)
                for s in snippets[:max_results]:
                    s_clean = re.sub(r"<[^<]+?>", "", s).strip()
                    results.append({"snippet": s_clean})
    except Exception as e:
        print(f"Error: {e}")
    return results

if __name__ == "__main__":
    res = search_live("proximo partido Manchester City 2026 fixture fecha hora")
    print(f"Resultados encontrados: {len(res)}")
    for r in res:
        print("->", r["snippet"])
