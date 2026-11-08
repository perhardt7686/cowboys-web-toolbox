"""Apply the shared public Toolbox brand to generated and hand-authored pages."""
import re

LOGO='<span class="brand-symbol" aria-hidden="true"><img src="toolbox-mark.webp" width="60" height="60" alt=""></span>'
THEME='<link rel="stylesheet" href="purple-night.css">'
TOUCH='<link rel="apple-touch-icon" href="toolbox-touch.png">'

def apply_brand(html):
    html=html.replace('<span class="brand-symbol" aria-hidden="true">✳</span>',LOGO)
    html=html.replace('<span class="window-icon" aria-hidden="true">✳</span>','<span class="window-icon" aria-hidden="true"><img src="toolbox-mark.webp" width="64" height="64" alt=""></span>')
    html=html.replace('>✳ COWBOY’S TOOLBOX</a>','>'+LOGO+'<span>COWBOY’S TOOLBOX</span></a>')
    html=html.replace('>✳</span>','>✳&#xfe0e;</span>')
    html=html.replace('href="favicon.svg"','href="toolbox-favicon.png"').replace('type="image/svg+xml"','type="image/png"')
    html=re.sub(r'<meta name="theme-color" content="[^"]*">','<meta name="theme-color" content="#09070e">',html)
    if '<meta name="theme-color"' not in html:
        html=html.replace('</head>','<meta name="theme-color" content="#09070e"></head>')
    if THEME not in html: html=html.replace('</head>',THEME+'</head>')
    if TOUCH not in html: html=html.replace('</head>',TOUCH+'</head>')
    return html
