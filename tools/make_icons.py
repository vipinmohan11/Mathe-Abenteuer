#!/usr/bin/env python3
"""Renders the app icons (Fino the fox) from the built app. Run `python3 build.py` first.
Needs: pip install playwright pillow && playwright install chromium"""
import pathlib
from playwright.sync_api import sync_playwright
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'dist' / 'Mathe-Abenteuer_Klasse4.html').as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 512, 'height': 512})
    pg.goto(html)
    svg = pg.evaluate("()=>__app.mascotSVG({skin:'fino',hat:null,extra:null,bg:null,mood:'happy'})")
    for name, scale in [('icon-512.png', 0.92), ('icon-maskable-512.png', 0.66)]:   # maskable = bigger safe zone
        size = int(512 * scale)
        pg.set_content(f"<body style='margin:0;width:512px;height:512px;background:radial-gradient(circle at 50% 35%,#FFE9B0,#FFB703);"
                       f"display:flex;align-items:center;justify-content:center;overflow:hidden'><div style='width:{size}px;height:{size}px'>{svg}</div>"
                       "<style>svg{width:100%;height:100%}</style>")
        pg.wait_for_timeout(300); pg.screenshot(path=str(root / name))
    b.close()
Image.open(root / 'icon-512.png').resize((192, 192), Image.LANCZOS).save(root / 'icon-192.png')
print('icons written')
