from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "cmc-professional-logo-directions"
OUT.mkdir(parents=True, exist_ok=True)

W, H = A4
LW, LH = landscape(A4)

INK = colors.HexColor("#141b1a")
IVORY = colors.HexColor("#f5efe4")
WARM = colors.HexColor("#fffaf2")
LINE = colors.HexColor("#d8ccba")
MUTED = colors.HexColor("#65706b")
TEAL = colors.HexColor("#2d746d")
GOLD = colors.HexColor("#b48d3d")
RED = colors.HexColor("#95483f")

try:
    pdfmetrics.registerFont(TTFont("GeorgiaPro", "/System/Library/Fonts/Supplemental/Georgia.ttf"))
except Exception:
    pass


DIRECTIONS = [
    ("01", "Cantus Index", "A disciplined score-and-catalogue mark. The C is implied by an aperture, not drawn as a letter."),
    ("02", "Resonance Register", "An institutional mark built from concentric listening spaces and a single catalogue entry."),
    ("03", "Folio Exchange", "Two filed score leaves meet to form a restrained marketplace and collaboration symbol."),
    ("04", "Measure Grid", "A modular catalogue grid with musical measure logic: ordered, searchable, and digital."),
    ("05", "Cue Monolith", "A confident app-icon route: a compact CMC monogram hidden inside a cue column."),
    ("06", "Archive Chorus", "A community mark: individual entries align into one shared musical catalogue."),
]


def font_name(preferred, fallback="Helvetica"):
    return preferred if preferred in pdfmetrics.getRegisteredFontNames() else fallback


def set_font(c, name="Helvetica", size=12, fill=INK):
    c.setFillColor(fill)
    c.setFont(name, size)


def tracked(c, text, x, y, font, size, tracking, fill=INK):
    set_font(c, font, size, fill)
    cursor = x
    for ch in text:
        c.drawString(cursor, y, ch)
        cursor += pdfmetrics.stringWidth(ch, font, size) + tracking


def wordmark(c, x, y, scale=1, dark=True):
    fill = INK if dark else WARM
    set_font(c, "Helvetica", 22 * scale, fill)
    c.drawString(x, y, "Classical Music")
    set_font(c, "Helvetica-Bold", 22 * scale, fill)
    c.drawString(x + 174 * scale, y, "Catalogue")
    tracked(c, "CMC", x + 1 * scale, y - 22 * scale, "Helvetica-Bold", 8.6 * scale, 2.2 * scale, MUTED if dark else LINE)


def draw_background(c, title=None, note=None):
    c.setFillColor(IVORY)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(WARM)
    c.rect(42, 46, W - 84, H - 92, stroke=0, fill=1)
    c.setStrokeColor(LINE)
    c.setLineWidth(1)
    c.rect(42, 46, W - 84, H - 92, stroke=1, fill=0)
    if title:
        set_font(c, "Helvetica-Bold", 23)
        c.drawString(70, H - 86, title)
        set_font(c, "Helvetica", 10.8, MUTED)
        c.drawString(70, H - 108, note)
        c.setStrokeColor(LINE)
        c.line(70, H - 134, W - 70, H - 134)


def square_proof(c, x, y, size=118):
    c.setFillColor(INK)
    c.roundRect(x, y, size, size, 18, stroke=0, fill=1)


def mark_01(c, x, y, s=1, mono=False, reverse=False):
    bg = WARM if not reverse else INK
    ink = WARM if reverse else INK
    accent = ink if mono or reverse else GOLD
    c.saveState()
    c.translate(x, y)
    c.scale(s, s)
    c.setLineCap(1)
    c.setLineJoin(1)
    c.setStrokeColor(ink)
    c.setLineWidth(9)
    c.arc(8, 8, 112, 112, 64, 232)
    c.setStrokeColor(accent)
    c.setLineWidth(6.5)
    for yy, width in [(88, 62), (72, 78), (56, 68), (40, 84), (24, 48)]:
        c.line(48, yy, 48 + width, yy)
    c.setFillColor(bg)
    c.rect(109, 48, 28, 36, stroke=0, fill=1)
    c.setFillColor(accent)
    c.circle(112, 40, 5.5, stroke=0, fill=1)
    c.restoreState()


def mark_02(c, x, y, s=1, mono=False, reverse=False):
    ink = WARM if reverse else INK
    accent = ink if mono or reverse else TEAL
    c.saveState()
    c.translate(x, y)
    c.scale(s, s)
    c.setLineCap(1)
    c.setStrokeColor(ink)
    c.setLineWidth(7)
    c.arc(6, 6, 122, 122, 34, 326)
    c.arc(28, 28, 100, 100, 205, 155)
    c.setStrokeColor(accent)
    c.setLineWidth(9)
    c.line(64, 28, 64, 102)
    c.setLineWidth(5)
    c.line(42, 48, 86, 48)
    c.line(42, 64, 86, 64)
    c.line(42, 80, 72, 80)
    c.restoreState()


def mark_03(c, x, y, s=1, mono=False, reverse=False):
    ink = WARM if reverse else INK
    accent = ink if mono or reverse else RED
    c.saveState()
    c.translate(x, y)
    c.scale(s, s)
    c.setLineJoin(1)
    c.setStrokeColor(ink)
    c.setLineWidth(7.5)
    p = c.beginPath()
    p.moveTo(20, 24)
    p.lineTo(80, 24)
    p.curveTo(103, 24, 116, 38, 116, 60)
    p.lineTo(116, 104)
    p.lineTo(56, 104)
    p.curveTo(34, 104, 20, 90, 20, 68)
    p.close()
    c.drawPath(p, stroke=1, fill=0)
    c.setStrokeColor(accent)
    c.setLineWidth(7.5)
    p = c.beginPath()
    p.moveTo(52, 12)
    p.lineTo(112, 12)
    p.curveTo(134, 12, 148, 26, 148, 48)
    p.lineTo(148, 92)
    p.lineTo(88, 92)
    p.curveTo(66, 92, 52, 78, 52, 56)
    p.close()
    c.drawPath(p, stroke=1, fill=0)
    c.setStrokeColor(ink)
    c.setLineWidth(4.5)
    c.line(44, 56, 94, 56)
    c.line(76, 76, 126, 76)
    c.restoreState()


def mark_04(c, x, y, s=1, mono=False, reverse=False):
    ink = WARM if reverse else INK
    accent = ink if mono or reverse else GOLD
    c.saveState()
    c.translate(x, y)
    c.scale(s, s)
    c.setLineCap(1)
    c.setStrokeColor(ink)
    c.setLineWidth(7)
    for yy in [28, 52, 76, 100]:
        c.line(20, yy, 132, yy)
    for xx in [44, 76, 108]:
        c.line(xx, 16, xx, 112)
    c.setFillColor(accent)
    c.roundRect(44, 52, 32, 24, 2, stroke=0, fill=1)
    c.roundRect(108, 76, 24, 24, 2, stroke=0, fill=1)
    c.setFillColor(ink)
    c.circle(20, 28, 4.6, stroke=0, fill=1)
    c.circle(132, 100, 4.6, stroke=0, fill=1)
    c.restoreState()


def mark_05(c, x, y, s=1, mono=False, reverse=False):
    bg = INK if reverse else WARM
    ink = WARM if reverse else INK
    accent = ink if mono or reverse else TEAL
    c.saveState()
    c.translate(x, y)
    c.scale(s, s)
    c.setFillColor(ink)
    c.roundRect(24, 8, 78, 128, 11, stroke=0, fill=1)
    c.setFillColor(bg)
    c.roundRect(42, 26, 42, 92, 6, stroke=0, fill=1)
    c.setFillColor(ink)
    c.rect(62, 26, 22, 92, stroke=0, fill=1)
    c.setFillColor(accent)
    c.roundRect(34, 48, 58, 10, 4, stroke=0, fill=1)
    c.roundRect(34, 86, 58, 10, 4, stroke=0, fill=1)
    c.setFillColor(bg)
    c.rect(82, 58, 22, 28, stroke=0, fill=1)
    c.restoreState()


def mark_06(c, x, y, s=1, mono=False, reverse=False):
    ink = WARM if reverse else INK
    accent = ink if mono or reverse else RED
    c.saveState()
    c.translate(x, y)
    c.scale(s, s)
    c.setLineCap(1)
    c.setStrokeColor(ink)
    c.setLineWidth(6.5)
    for yy in [28, 52, 76, 100]:
        c.line(16, yy, 140, yy)
    c.setFillColor(ink)
    for xx, yy in [(32, 28), (58, 76), (84, 52), (110, 100), (136, 76)]:
        c.circle(xx, yy, 7, stroke=0, fill=1)
    c.setStrokeColor(accent)
    c.setLineWidth(5)
    c.line(32, 28, 58, 76)
    c.line(58, 76, 84, 52)
    c.line(84, 52, 110, 100)
    c.line(110, 100, 136, 76)
    c.restoreState()


MARKS = [mark_01, mark_02, mark_03, mark_04, mark_05, mark_06]


def draw_direction(num, name, note, idx):
    path = OUT / f"cmc-professional-direction-{num}.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    draw_background(c, f"{num} {name}", note)
    mark = MARKS[idx]
    mark(c, 92, H - 372, 1.38)
    wordmark(c, 300, H - 260, 0.68)

    set_font(c, "Helvetica-Bold", 8.5, MUTED)
    tracked(c, "APP ICON", 88, H - 402, "Helvetica-Bold", 8.5, 1.3, MUTED)
    square_proof(c, 88, H - 542, 118)
    mark(c, 98, H - 532, 0.72, reverse=True)

    tracked(c, "MONOCHROME", 248, H - 402, "Helvetica-Bold", 8.5, 1.3, MUTED)
    mark(c, 250, H - 524, 0.78, mono=True)

    tracked(c, "LOCKUP", 382, H - 402, "Helvetica-Bold", 8.5, 1.3, MUTED)
    mark(c, 384, H - 492, 0.38)
    wordmark(c, 440, H - 448, 0.34)

    c.setStrokeColor(LINE)
    c.line(70, 228, W - 70, 228)
    set_font(c, "Helvetica-Bold", 10, INK)
    c.drawString(70, 200, "Why this is different")
    set_font(c, "Helvetica", 9.6, MUTED)
    copy = [
        "Built as an identity route, not a pictogram: the mark has a primary shape, a small-size proof,",
        "a wordmark relationship, and a black-and-white reading. The visual language is still simple,",
        "but the proportions, contrast, and negative space are doing more of the brand work.",
    ]
    for line_no, text in enumerate(copy):
        c.drawString(70, 178 - line_no * 15, text)
    c.showPage()
    c.save()
    return path


def draw_overview():
    path = OUT / "cmc-professional-logo-directions-overview.pdf"
    c = canvas.Canvas(str(path), pagesize=landscape(A4))
    c.setFillColor(IVORY)
    c.rect(0, 0, LW, LH, stroke=0, fill=1)
    set_font(c, "Helvetica-Bold", 26)
    c.drawString(42, LH - 48, "Classical Music Catalogue - professional logo directions")
    set_font(c, "Helvetica", 10.5, MUTED)
    c.drawString(42, LH - 68, "Six more considered identity routes: fewer, stronger, more scalable, less emoji-like.")
    card_w, card_h = 238, 184
    for idx, (num, name, note) in enumerate(DIRECTIONS):
        row, col = divmod(idx, 3)
        x = 42 + col * (card_w + 22)
        y = LH - 106 - row * (card_h + 24) - card_h
        c.setFillColor(WARM)
        c.roundRect(x, y, card_w, card_h, 3, stroke=0, fill=1)
        c.setStrokeColor(LINE)
        c.roundRect(x, y, card_w, card_h, 3, stroke=1, fill=0)
        MARKS[idx](c, x + 22, y + 64, 0.58)
        set_font(c, "Helvetica-Bold", 11.5)
        c.drawString(x + 118, y + 126, f"{num} {name}")
        set_font(c, "Helvetica", 8, MUTED)
        c.drawString(x + 118, y + 108, "Classical Music Catalogue")
        tracked(c, "CMC", x + 119, y + 94, "Helvetica-Bold", 6.3, 1.2, MUTED)
        c.setFillColor(INK)
        c.roundRect(x + 118, y + 46, 40, 40, 7, stroke=0, fill=1)
        MARKS[idx](c, x + 122, y + 50, 0.24, reverse=True)
        MARKS[idx](c, x + 176, y + 48, 0.28, mono=True)
    c.showPage()
    c.save()
    return path


def main():
    overview = draw_overview()
    print(overview)
    for idx, (num, name, note) in enumerate(DIRECTIONS):
        print(draw_direction(num, name, note, idx))


if __name__ == "__main__":
    main()
