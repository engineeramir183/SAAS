with open('src/pages/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

target = '''            <div class="metadata-row">
                <div>APPLYING FOR: <span class="meta-val-underlined" style="min-width: 120px;">${applyingFor.toUpperCase()}</span></div>
                <div>SERIAL #: <span class="meta-val-highlight">${serialNumber || d.inquiryNumber || '0'}</span></div>
                <div>DATE: <span class="meta-val-underlined">${formatDate(applicationDate)}</span></div>
            </div>

            <div class="title-badge-container">
                <div class="title-badge">ADMISSION FORM</div>
            </div>'''

replacement = '''            <div class="metadata-row">
                <div>ADMISSION CLASS: <span class="meta-val-underlined" style="min-width: 140px; font-size: 13px; color: #1e3a8a; background: #eff6ff; padding: 2px 10px; border-radius: 4px;">${(applyingFor || 'NOT SPECIFIED').toUpperCase()}</span></div>
                <div>SERIAL #: <span class="meta-val-highlight">${serialNumber || d.inquiryNumber || '0'}</span></div>
                <div>DATE: <span class="meta-val-underlined">${formatDate(applicationDate)}</span></div>
            </div>

            <div class="title-badge-container" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div class="title-badge">ADMISSION FORM</div>
                ${applyingFor ? `<div style="font-size: 12px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">CLASS: <span style="text-decoration: underline;">${applyingFor.toUpperCase()}</span></div>` : ''}
            </div>'''

if target in text:
    text = text.replace(target, replacement, 1)
    with open('src/pages/AdminPortal.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    print("Prominently added class on printed admission form")
else:
    print("Target not found for print title")
