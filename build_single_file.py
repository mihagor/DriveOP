"""Combine the DriveOP project into one offline HTML file (Python 3.9+)."""
from pathlib import Path
import base64
import mimetypes

ROOT = Path(__file__).resolve().parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + (ROOT / "styles.css").read_text(encoding="utf-8") + '\n</style>')
for name in ("content.js", "app.js"):
    html = html.replace(f'<script src="{name}"></script>', '<script>\n' + (ROOT / name).read_text(encoding="utf-8") + '\n</script>')
for path in (ROOT / "assets").iterdir():
    if not path.is_file():
        continue
    reference = "assets/" + path.name
    if reference not in html:
        continue
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    html = html.replace(reference, f"data:{mime};base64,{data}")
out = ROOT / "DriveOP_Pitch.html"
out.write_text(html, encoding="utf-8")
print(f"Created {out.name} ({out.stat().st_size:,} bytes)")
