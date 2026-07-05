from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "cmc-logo-medium-studies"
OUT.mkdir(parents=True, exist_ok=True)

W, H = A4
LW, LH = landscape(A4)

INK = colors.HexColor("#17201f")
IVORY = colors.HexColor("#f6f0e6")
PAPER = colors.HexColor("#fffaf1")
LINE = colors.HexColor("#d8cdbc")
TEAL = colors.HexColor("#2f766f")
GOLD = colors.HexColor("#b8954a")
RED = colors.HexColor("#9f4e45")
MUTED = colors.HexColor("#66716c")


CONCEPTS = [
    ("01", "Accession Stamp", "A library stamp for recorded accompaniments entering the catalogue."),
    ("02", "Rehearsal Card", "A cue-card mark built from count-in ticks and a filed repertoire card."),
    ("03", "Shelfmark Spine", "A narrow archive-spine identity for browsable collections and saved tracks."),
    ("04", "Performance Slip", "A booking-slip object with one red request mark and a playback line."),
    ("05", "Listening Index", "A circular listening-room index, more archive than audio app."),
    ("06", "Folio Tab", "A folded score tab that can collapse into an app badge."),
    ("07", "Community Ledger", "A ledger of contributors, buyers, requests, and comments."),
    ("08", "Conservatoire Seal", "A restrained institutional seal built from modular CMC counters."),
    ("09", "Backing Track Ticket", "A practical claim-ticket for a backing track order or request."),
    ("10", "System Card", "A machine-readable catalogue card with musical rhythm in the columns."),
    ("11", "Practice Docket", "A teacher-student practice docket with one saved cue."),
    ("12", "Archive Routing", "A routing label for upload, review, purchase, and discussion flows."),
]


def set_font(c, name="Helvetica", size=12, fill=INK):
    c.setFillColor(fill)
    c.setFont(name, size)


def page_frame(c, number, title, note):
    c.setFillColor(IVORY)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(PAPER)
    c.roundRect(42, 52, W - 84, H - 104, 14, stroke=0, fill=1)
    c.setStrokeColor(LINE)
    c.setLineWidth(1.1)
    c.roundRect(42, 52, W - 84, H - 104, 14, stroke=1, fill=0)
    set_font(c, "Helvetica-Bold", 20)
    c.drawString(72, H - 92, f"{number} {title}")
    set_font(c, "Helvetica", 10.5, MUTED)
    c.drawString(72, H - 112, note)
    set_font(c, "Helvetica-Bold", 8.5, MUTED)
    c.drawRightString(W - 72, H - 92, "CLASSICAL MUSIC CATALOGUE")
    c.setStrokeColor(LINE)
    c.line(72, H - 136, W - 72, H - 136)


def wordmark(c, x, y, scale=1):
    set_font(c, "Helvetica-Bold", 18 * scale)
    c.drawString(x, y, "Classical Music Catalogue")
    set_font(c, "Helvetica-Bold", 7.5 * scale, MUTED)
    c.drawString(x + 1 * scale, y - 13 * scale, "CMC")


def draw_mark(c, i, x, y, s=1, mono=False):
    accent = INK if mono else [GOLD, TEAL, RED, GOLD, TEAL, RED, GOLD, TEAL, GOLD, RED, TEAL, GOLD][i]
    c.saveState()
    c.translate(x, y)
    c.scale(s, s)
    c.setLineCap(1)
    c.setLineJoin(1)
    c.setStrokeColor(INK)
    c.setFillColor(INK)
    c.setLineWidth(6)

    if i == 0:
        c.roundRect(0, 0, 92, 92, 10, stroke=1, fill=0)
        for yy, ww in [(66, 55), (50, 64), (34, 58), (18, 38)]:
            c.line(18, yy, 18 + ww, yy)
        c.setStrokeColor(accent)
        c.line(68, 92, 92, 92)
        c.line(92, 92, 92, 66)
        c.setFillColor(accent)
        c.circle(72, 18, 6, stroke=0, fill=1)
    elif i == 1:
        c.roundRect(4, 8, 88, 76, 8, stroke=1, fill=0)
        for xx in [22, 38, 54, 70]:
            c.line(xx, 84, xx, 100)
        c.setStrokeColor(accent)
        c.line(20, 42, 38, 42)
        c.line(38, 42, 48, 64)
        c.line(48, 64, 60, 24)
        c.line(60, 24, 72, 42)
        c.setFillColor(accent)
        c.circle(80, 42, 5, stroke=0, fill=1)
    elif i == 2:
        for yy in [16, 38, 60, 82]:
            c.roundRect(18, yy, 62, 13, 4, stroke=1, fill=0)
        c.setFillColor(accent)
        c.rect(0, 10, 10, 88, stroke=0, fill=1)
        c.rect(86, 10, 10, 88, stroke=0, fill=1)
    elif i == 3:
        c.roundRect(8, 18, 82, 58, 8, stroke=1, fill=0)
        c.line(28, 18, 28, 76)
        c.setStrokeColor(accent)
        c.line(42, 58, 76, 58)
        c.line(42, 42, 64, 42)
        c.line(42, 26, 76, 26)
        c.setFillColor(INK)
        c.circle(28, 47, 5, stroke=0, fill=1)
        c.setFillColor(accent)
        c.circle(84, 76, 7, stroke=0, fill=1)
    elif i == 4:
        c.circle(48, 48, 41, stroke=1, fill=0)
        c.circle(48, 48, 12, stroke=1, fill=0)
        c.setStrokeColor(accent)
        for a in range(0, 360, 45):
            c.saveState()
            c.translate(48, 48)
            c.rotate(a)
            c.line(0, 26, 0, 38)
            c.restoreState()
        c.line(92, 30, 112, 30)
        c.line(92, 48, 120, 48)
        c.line(92, 66, 108, 66)
    elif i == 5:
        c.path = c.beginPath()
        c.path.moveTo(14, 6)
        c.path.lineTo(64, 6)
        c.path.lineTo(92, 34)
        c.path.lineTo(92, 92)
        c.path.lineTo(14, 92)
        c.path.close()
        c.drawPath(c.path, stroke=1, fill=0)
        c.setStrokeColor(accent)
        c.line(64, 8, 64, 34)
        c.line(64, 34, 90, 34)
        c.line(30, 58, 72, 58)
        c.line(30, 74, 58, 74)
    elif i == 6:
        for xx, yy in [(20, 70), (50, 46), (78, 70), (50, 94), (20, 22), (78, 22)]:
            c.circle(xx, yy, 7, stroke=1, fill=0)
        c.setStrokeColor(accent)
        c.line(20, 70, 50, 46)
        c.line(78, 70, 50, 46)
        c.line(50, 46, 50, 94)
        c.line(20, 22, 50, 46)
        c.line(78, 22, 50, 46)
    elif i == 7:
        c.arc(8, 12, 88, 92, 70, 220)
        c.arc(36, 12, 116, 92, -40, 110)
        c.line(36, 16, 36, 62)
        c.line(68, 16, 68, 62)
        c.setStrokeColor(accent)
        c.line(36, 16, 68, 16)
        c.line(36, 62, 68, 62)
    elif i == 8:
        c.roundRect(4, 20, 92, 58, 8, stroke=1, fill=0)
        c.setStrokeColor(accent)
        c.line(18, 50, 42, 50)
        c.line(42, 50, 54, 66)
        c.line(54, 66, 68, 34)
        c.line(68, 34, 84, 50)
        c.setFillColor(INK)
        c.circle(20, 20, 5, stroke=0, fill=1)
        c.circle(80, 78, 5, stroke=0, fill=1)
    elif i == 9:
        for xx in [16, 34, 52, 70]:
            c.line(xx, 12, xx, 88)
        for yy in [18, 38, 58, 78]:
            c.line(10, yy, 88, yy)
        c.setFillColor(accent)
        c.rect(34, 38, 18, 20, stroke=0, fill=1)
        c.rect(70, 58, 18, 20, stroke=0, fill=1)
    elif i == 10:
        c.path = c.beginPath()
        c.path.moveTo(22, 10)
        c.path.lineTo(80, 10)
        c.path.lineTo(80, 98)
        c.path.lineTo(51, 78)
        c.path.lineTo(22, 98)
        c.path.close()
        c.drawPath(c.path, stroke=1, fill=0)
        c.setStrokeColor(accent)
        c.line(38, 40, 64, 40)
        c.line(38, 56, 64, 56)
        c.setFillColor(accent)
        c.circle(66, 72, 6, stroke=0, fill=1)
    else:
        for yy in [26, 50, 74]:
            c.line(12, yy, 92, yy)
        c.setFillColor(accent)
        c.roundRect(24, 14, 20, 24, 4, stroke=0, fill=1)
        c.roundRect(52, 38, 30, 24, 4, stroke=0, fill=1)
        c.roundRect(34, 62, 24, 24, 4, stroke=0, fill=1)
        c.setStrokeColor(INK)
        c.bezier(92, 26, 108, 36, 108, 42, 92, 50)
        c.bezier(92, 50, 108, 60, 108, 66, 92, 74)
    c.restoreState()


def draw_medium(c, i):
    if i == 0:
        c.setStrokeColor(LINE)
        for y in range(250, 572, 26):
            c.line(82, y, W - 82, y)
        c.setStrokeColor(GOLD)
        c.setLineWidth(2)
        c.roundRect(360, 430, 120, 54, 5, stroke=1, fill=0)
        set_font(c, "Courier-Bold", 11, GOLD)
        c.drawString(374, 462, "ACCESSION")
        c.drawString(389, 445, "CMC-0001")
    elif i == 1:
        c.setStrokeColor(LINE)
        for x in [102, 180, 258, 336, 414, 492]:
            c.line(x, 245, x, 575)
        c.setFillColor(colors.HexColor("#fbf6ed"))
        c.roundRect(92, 260, 410, 190, 8, stroke=1, fill=1)
    elif i == 2:
        for x, col in [(96, TEAL), (160, INK), (224, GOLD), (288, INK), (352, RED), (416, INK)]:
            c.setFillColor(col)
            c.rect(x, 236, 42, 338, stroke=0, fill=1)
        set_font(c, "Helvetica-Bold", 15, PAPER)
        c.saveState()
        c.translate(124, 548)
        c.rotate(-90)
        c.drawString(0, 0, "CMC / BACKING TRACKS")
        c.restoreState()
    elif i == 3:
        c.setStrokeColor(LINE)
        c.setLineWidth(1)
        c.roundRect(86, 258, 422, 244, 10, stroke=1, fill=0)
        for y in [318, 378, 438]:
            c.line(86, y, 508, y)
        c.line(210, 258, 210, 502)
        c.line(370, 258, 370, 502)
    elif i == 4:
        c.setStrokeColor(LINE)
        c.circle(292, 410, 154, stroke=1, fill=0)
        c.circle(292, 410, 114, stroke=1, fill=0)
        c.circle(292, 410, 72, stroke=1, fill=0)
    elif i == 5:
        c.setFillColor(colors.HexColor("#fbf6ed"))
        c.rect(96, 250, 190, 294, stroke=1, fill=1)
        c.rect(286, 250, 190, 294, stroke=1, fill=1)
        c.setStrokeColor(LINE)
        c.line(286, 250, 286, 544)
    elif i == 6:
        c.setStrokeColor(LINE)
        for y in range(260, 558, 32):
            c.line(88, y, 508, y)
        for x in [170, 290, 410]:
            c.line(x, 260, x, 548)
    elif i == 7:
        c.setStrokeColor(LINE)
        c.circle(292, 410, 138, stroke=1, fill=0)
        c.circle(292, 410, 106, stroke=1, fill=0)
        c.circle(292, 410, 74, stroke=1, fill=0)
        set_font(c, "Helvetica-Bold", 9, MUTED)
        c.drawCentredString(292, 556, "UPLOAD  DISCOVER  REQUEST  DISCUSS")
    elif i == 8:
        c.setFillColor(colors.HexColor("#fbf6ed"))
        c.roundRect(96, 300, 402, 180, 8, stroke=1, fill=1)
        c.setStrokeColor(LINE)
        c.line(96, 420, 498, 420)
        c.line(220, 300, 220, 480)
    elif i == 9:
        c.setStrokeColor(LINE)
        for x in range(98, 506, 34):
            c.line(x, 252, x, 548)
        for y in range(252, 550, 24):
            c.line(98, y, 506, y)
    elif i == 10:
        c.setFillColor(colors.HexColor("#fbf6ed"))
        c.roundRect(112, 248, 370, 300, 10, stroke=1, fill=1)
        c.setStrokeColor(LINE)
        for y in [326, 386, 446, 506]:
            c.line(112, y, 482, y)
    else:
        c.setStrokeColor(LINE)
        c.setLineWidth(1.4)
        c.roundRect(96, 280, 400, 210, 8, stroke=1, fill=0)
        for x in [176, 256, 336, 416]:
            c.line(x, 280, x, 490)


def draw_concept_pdf(num, title, note, idx):
    path = OUT / f"cmc-logo-medium-study-{num}.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    page_frame(c, num, title, note)
    c.saveState()
    c.translate(0, -118)
    draw_medium(c, idx)
    c.restoreState()
    draw_mark(c, idx, 104, H - 290, 1.12)
    wordmark(c, 306, H - 240, 0.92)
    set_font(c, "Helvetica-Bold", 9, MUTED)
    c.drawString(306, H - 285, "ICON PROOF")
    draw_mark(c, idx, 306, H - 392, 0.72, mono=True)
    set_font(c, "Helvetica-Bold", 9, MUTED)
    c.drawString(410, H - 285, "SMALL LOCKUP")
    draw_mark(c, idx, 410, H - 374, 0.36)
    wordmark(c, 454, H - 337, 0.42)
    set_font(c, "Helvetica", 9.2, MUTED)
    c.drawString(82, 112, "Medium study, not final artwork.")
    c.drawString(82, 98, "Testing whether the identity can live in practical musical/archive contexts.")
    c.showPage()
    c.save()
    return path


def draw_contact(paths):
    path = OUT / "cmc-logo-medium-studies-contact-sheet.pdf"
    c = canvas.Canvas(str(path), pagesize=landscape(A4))
    c.setFillColor(IVORY)
    c.rect(0, 0, LW, LH, stroke=0, fill=1)
    set_font(c, "Helvetica-Bold", 26)
    c.drawString(38, LH - 50, "CMC logo medium studies")
    set_font(c, "Helvetica", 11, MUTED)
    c.drawString(38, LH - 70, "Twelve PDF-first studies using archive, rehearsal, catalogue, and institutional print objects as the medium.")
    card_w, card_h = 242, 100
    left, top = 38, LH - 102
    for idx, (num, title, note) in enumerate(CONCEPTS):
        row, col = divmod(idx, 3)
        x = left + col * (card_w + 18)
        y = top - row * (card_h + 14) - card_h
        c.setFillColor(PAPER)
        c.roundRect(x, y, card_w, card_h, 8, stroke=0, fill=1)
        c.setStrokeColor(LINE)
        c.roundRect(x, y, card_w, card_h, 8, stroke=1, fill=0)
        draw_mark(c, idx, x + 18, y + 24, 0.46)
        set_font(c, "Helvetica-Bold", 10.4)
        c.drawString(x + 76, y + 70, f"{num} {title}")
        set_font(c, "Helvetica", 7.4, MUTED)
        c.drawString(x + 76, y + 55, "Classical Music Catalogue")
        c.drawString(x + 76, y + 40, "PDF medium study")
    c.showPage()
    c.save()
    return path


def main():
    paths = [draw_concept_pdf(num, title, note, i) for i, (num, title, note) in enumerate(CONCEPTS)]
    contact = draw_contact(paths)
    print(contact)
    for path in paths:
        print(path)


if __name__ == "__main__":
    main()
