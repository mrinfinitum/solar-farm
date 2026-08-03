#!/usr/bin/env python3
"""Generate NSoul's public, indicative PPA term-sheet PDF."""

from pathlib import Path
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "documents" / "cornerstone-solar-indicative-term-sheet.pdf"

INK = HexColor("#10261D")
DARK = HexColor("#0B1A14")
MUTED = HexColor("#64766E")
SAGE = HexColor("#EAF1E7")
LIME = HexColor("#A6DE45")
WHITE = HexColor("#F8FAF5")
LINE = HexColor("#CBD7CE")


def rounded_panel(pdf, x, y, w, h, fill=SAGE, stroke=None, radius=14):
    pdf.setFillColor(fill)
    pdf.setStrokeColor(stroke or fill)
    pdf.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)


def text(pdf, value, x, y, size=10, font="Helvetica", color=INK):
    pdf.setFillColor(color)
    pdf.setFont(font, size)
    pdf.drawString(x, y, value)


def wrapped(pdf, value, x, y, width, size=10, leading=14, color=MUTED, font="Helvetica"):
    words = value.split()
    lines, line = [], ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if pdf.stringWidth(candidate, font, size) <= width:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    for index, row in enumerate(lines):
        text(pdf, row, x, y - index * leading, size, font, color)
    return y - len(lines) * leading


def header(pdf, page):
    pdf.setFillColor(DARK)
    pdf.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
    text(pdf, "NSOUL", 44, 744, 16, "Helvetica-Bold", WHITE)
    text(pdf, "COMMERCIAL ENERGY DEVELOPMENT", 44, 726, 7.5, "Helvetica-Bold", LIME)
    text(pdf, f"INDICATIVE TERM SHEET  /  {page:02d}", 414, 740, 7.5, "Courier-Bold", MUTED)
    pdf.setStrokeColor(HexColor("#2A3C34"))
    pdf.line(44, 710, 568, 710)


def footer(pdf):
    pdf.setStrokeColor(HexColor("#2A3C34"))
    pdf.line(44, 48, 568, 48)
    text(pdf, "NSoul LLC  ·  Development-stage information  ·  August 2026", 44, 30, 7.5, "Courier", MUTED)
    text(pdf, "INDICATIVE & NON-BINDING", 430, 30, 7.5, "Courier-Bold", LIME)


def page_one(pdf):
    header(pdf, 1)
    text(pdf, "INDICATIVE & NON-BINDING", 44, 670, 8.5, "Courier-Bold", LIME)
    text(pdf, "1 Cornerstone Lane", 44, 625, 31, "Helvetica-Bold", WHITE)
    text(pdf, "Solar Farm", 44, 590, 31, "Helvetica-Bold", WHITE)
    wrapped(pdf, "A preliminary commercial framework for discussion with a qualified regional energy customer.", 44, 552, 430, 12, 17, HexColor("#AFBDB6"))

    rounded_panel(pdf, 44, 420, 524, 92, HexColor("#14271F"), HexColor("#31483E"), 16)
    facts = [
        ("1.5 MW DC", "Proposed capacity"),
        ("~2.25M kWh", "Estimated Year 1 generation"),
        ("20 years", "Indicative agreement term"),
    ]
    for index, (value, label) in enumerate(facts):
        x = 66 + index * 172
        if index:
            pdf.setStrokeColor(HexColor("#31483E"))
            pdf.line(x - 20, 438, x - 20, 494)
        text(pdf, value, x, 468, 18, "Helvetica-Bold", WHITE)
        text(pdf, label, x, 447, 7.5, "Helvetica", MUTED)

    text(pdf, "PROJECT OVERVIEW", 44, 375, 8, "Courier-Bold", LIME)
    rows = [
        ("Location", "1 Cornerstone Lane, Idabel, Oklahoma 74745"),
        ("County", "McCurtain County"),
        ("Technology", "Ground-mounted photovoltaic array"),
        ("Commercial structure", "Indicative long-term Power Purchase Agreement"),
        ("Current stage", "Development"),
        ("Target operation", "Q2/Q3 2027, subject to utility and final approvals"),
    ]
    y = 342
    for label, value in rows:
        text(pdf, label.upper(), 44, y, 7, "Courier-Bold", MUTED)
        text(pdf, value, 205, y, 10, "Helvetica-Bold", WHITE)
        pdf.setStrokeColor(HexColor("#23382F"))
        pdf.line(44, y - 12, 568, y - 12)
        y -= 38

    footer(pdf)
    pdf.showPage()


def page_two(pdf):
    header(pdf, 2)
    text(pdf, "COMMERCIAL FRAMEWORK", 44, 670, 8.5, "Courier-Bold", LIME)
    text(pdf, "Indicative terms for evaluation", 44, 630, 25, "Helvetica-Bold", WHITE)
    wrapped(pdf, "These directional terms support preliminary discussion only. Final terms require diligence, approvals, financing, and executed project documents.", 44, 600, 500, 10.5, 15, HexColor("#AFBDB6"))

    terms = [
        ("Starting energy rate", "$0.08075 / kWh", "Indicative Year 1 PPA rate"),
        ("Annual escalator", "2.0%", "Illustrative escalation assumption"),
        ("Modeled utility baseline", "$0.09500 / kWh", "Reference assumption, not a utility quote"),
        ("Indicative starting difference", "~15%", "Not a guaranteed discount or savings result"),
        ("Customer equipment capital", "Potentially $0", "Subject to final structure and agreement"),
        ("Renewable attributes", "Proposed transfer", "Subject to documented REC terms"),
    ]
    y = 536
    for label, value, note in terms:
        rounded_panel(pdf, 44, y - 45, 524, 58, HexColor("#12251D"), HexColor("#2A4036"), 10)
        text(pdf, label.upper(), 60, y - 5, 7, "Courier-Bold", MUTED)
        text(pdf, value, 286, y - 4, 15, "Helvetica-Bold", WHITE)
        text(pdf, note, 286, y - 23, 7.5, "Helvetica", HexColor("#9FB0A8"))
        y -= 66

    footer(pdf)
    pdf.showPage()


def page_three(pdf):
    header(pdf, 3)
    text(pdf, "DEPENDENCIES & NEXT STEPS", 44, 670, 8.5, "Courier-Bold", LIME)
    text(pdf, "What must be validated", 44, 630, 25, "Helvetica-Bold", WHITE)
    intro_y = wrapped(pdf, "The proposed project remains contingent on technical, commercial, legal, and financial diligence. The following items are not represented as complete or approved.", 44, 598, 500, 10.5, 15, HexColor("#AFBDB6"))

    items = [
        "Utility service territory, circuit capacity, interconnection scope, cost, and schedule",
        "Final site control, survey, title, access, environmental, civil, and geotechnical diligence",
        "Final array design, production estimate, EPC pricing, operating plan, and equipment selection",
        "Customer load profile, credit, pricing, delivery terms, Renewable Energy Certificates, and legal documents",
        "Financing, insurance, permitting, tax treatment, incentives, procurement, and construction schedule",
    ]
    y = intro_y - 22
    for index, item in enumerate(items, 1):
        rounded_panel(pdf, 44, y - 54, 524, 66, HexColor("#12251D"), HexColor("#2A4036"), 10)
        text(pdf, f"{index:02d}", 60, y - 15, 12, "Courier-Bold", LIME)
        wrapped(pdf, item, 102, y - 10, 440, 9.5, 13, WHITE, "Helvetica")
        y -= 76

    rounded_panel(pdf, 44, 104, 524, 88, HexColor("#A6DE45"), radius=12)
    text(pdf, "IMPORTANT", 60, 168, 7.5, "Courier-Bold", INK)
    wrapped(pdf, "This term sheet is indicative and non-binding. It is not an offer, commitment, final production estimate, utility approval, savings guarantee, financing commitment, or construction notice. Any binding obligation must be contained in definitive written agreements signed by authorized parties.", 60, 147, 490, 9, 12, INK, "Helvetica-Bold")

    footer(pdf)
    pdf.showPage()


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=letter, pageCompression=1)
    pdf.setTitle("NSoul 1 Cornerstone Lane Indicative PPA Term Sheet")
    pdf.setAuthor("NSoul LLC")
    pdf.setSubject("Indicative and non-binding commercial energy term sheet")
    page_one(pdf)
    page_two(pdf)
    page_three(pdf)
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
