"""
report_generator.py
Generates a branded PDF summary report using ReportLab.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from data_processor import get_store
from eda_engine import summary_statistics, correlation_matrix, detect_outliers, dashboard_kpis


# ─── Colour palette ──────────────────────────────────────────────────────────
INDIGO = colors.HexColor("#6366f1")
DARK_BG = colors.HexColor("#0f172a")
CARD_BG = colors.HexColor("#1e293b")
LIGHT_TEXT = colors.HexColor("#e2e8f0")
MUTED = colors.HexColor("#94a3b8")
WHITE = colors.white
GREEN = colors.HexColor("#22c55e")
AMBER = colors.HexColor("#f59e0b")
RED = colors.HexColor("#ef4444")


def generate_pdf() -> bytes:
    """Build and return the PDF as bytes."""
    store = get_store()
    if store["clean"] is None:
        raise ValueError("No dataset loaded.")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="IntelliDash Analytics Report",
        author="Aryan Chandak",
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Custom styles ──────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        fontSize=24, textColor=INDIGO, spaceAfter=6, alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=11, textColor=MUTED, spaceAfter=4, alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"],
        fontSize=14, textColor=INDIGO, spaceBefore=16, spaceAfter=6,
        fontName="Helvetica-Bold", borderPad=4,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#334155"), spaceAfter=4,
    )
    small_style = ParagraphStyle(
        "Small", parent=styles["Normal"],
        fontSize=8, textColor=MUTED,
    )

    # ── Cover / Header ─────────────────────────────────────────────────────
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph("IntelliDash", title_style))
    story.append(Paragraph("AI-Powered Business Analytics Platform", subtitle_style))
    story.append(Paragraph("Analytics Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=INDIGO, spaceAfter=12))

    # Meta info table
    now = datetime.now().strftime("%B %d, %Y  %H:%M")
    meta = [
        ["Student", "Aryan Chandak (1DT22CG007)"],
        ["College", "DSATM, Bengaluru  |  VTU"],
        ["Internship", "Data Analytics Intern, Rooman Technologies"],
        ["Period", "Feb 2026 – May 2026"],
        ["Report Generated", now],
        ["Dataset", store.get("filename", "N/A")],
    ]
    meta_table = Table(meta, colWidths=[5 * cm, 12 * cm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), INDIGO),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#334155")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f8fafc"), WHITE]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Dataset Overview ───────────────────────────────────────────────────
    story.append(Paragraph("1. Dataset Overview", section_style))
    try:
        kpi_data = dashboard_kpis()
        kpis = kpi_data["kpis"]
        kpi_rows = [
            ["Metric", "Value"],
            ["Total Records", f"{kpis['total_records']:,}"],
            ["Numeric Columns", str(kpis["numeric_columns"])],
            ["Missing Data %", f"{kpis['missing_pct']}%"],
            ["Data Quality Score", f"{kpis['quality_score']:.1f} / 100"],
        ]
        kpi_table = _styled_table(kpi_rows)
        story.append(kpi_table)
    except Exception as e:
        story.append(Paragraph(f"Could not load KPIs: {e}", body_style))

    story.append(Spacer(1, 0.4 * cm))

    # ── Summary Statistics ─────────────────────────────────────────────────
    story.append(Paragraph("2. Summary Statistics (Numeric Columns)", section_style))
    try:
        stats_data = summary_statistics()
        if stats_data["stats"]:
            headers = ["Column", "Mean", "Std Dev", "Min", "Median", "Max", "Missing"]
            rows = [headers]
            for s in stats_data["stats"]:
                rows.append([
                    s["column"],
                    f"{s['mean']:,.2f}",
                    f"{s['std']:,.2f}",
                    f"{s['min']:,.2f}",
                    f"{s['median']:,.2f}",
                    f"{s['max']:,.2f}",
                    f"{s['missing']} ({s['missing_pct']}%)",
                ])
            story.append(_styled_table(rows, col_widths=[4, 2.5, 2.5, 2.5, 2.5, 2.5, 3]))
        else:
            story.append(Paragraph("No numeric columns found.", body_style))
    except Exception as e:
        story.append(Paragraph(f"Could not compute statistics: {e}", body_style))

    story.append(Spacer(1, 0.4 * cm))

    # ── Categorical Insights ───────────────────────────────────────────────
    story.append(Paragraph("3. Categorical Column Insights", section_style))
    try:
        cat_stats = stats_data.get("categorical_stats", [])
        if cat_stats:
            for cs in cat_stats[:5]:
                story.append(Paragraph(
                    f"<b>{cs['column']}</b>: {cs['unique_values']} unique values. "
                    f"Most frequent: <i>{cs['top_value']}</i> ({cs['top_count']} occurrences).",
                    body_style
                ))
                top_rows = [["Value", "Count"]] + [
                    [item["value"], str(item["count"])] for item in cs["top_10"][:5]
                ]
                story.append(_styled_table(top_rows, col_widths=[8, 4]))
                story.append(Spacer(1, 0.2 * cm))
        else:
            story.append(Paragraph("No categorical columns found.", body_style))
    except Exception as e:
        story.append(Paragraph(f"Could not load categorical stats: {e}", body_style))

    story.append(Spacer(1, 0.4 * cm))

    # ── Correlation Highlights ─────────────────────────────────────────────
    story.append(Paragraph("4. Top Correlation Pairs", section_style))
    try:
        corr_data = correlation_matrix()
        pairs = corr_data.get("pairs", [])[:10]
        if pairs:
            headers = ["Column 1", "Column 2", "Correlation", "Strength"]
            rows = [headers] + [
                [p["col1"], p["col2"], f"{p['correlation']:.4f}", p["strength"]]
                for p in pairs
            ]
            story.append(_styled_table(rows, col_widths=[5, 5, 3.5, 4]))
        else:
            story.append(Paragraph("Insufficient numeric columns for correlation.", body_style))
    except Exception as e:
        story.append(Paragraph(f"Could not compute correlations: {e}", body_style))

    story.append(Spacer(1, 0.4 * cm))

    # ── Outlier Summary ────────────────────────────────────────────────────
    story.append(Paragraph("5. Outlier Detection (IQR Method)", section_style))
    try:
        outlier_data = detect_outliers()
        summary = outlier_data.get("summary", [])
        if summary:
            headers = ["Column", "Lower Fence", "Upper Fence", "Outliers", "Outlier %"]
            rows = [headers] + [
                [
                    s["column"],
                    f"{s['lower_fence']:,.2f}",
                    f"{s['upper_fence']:,.2f}",
                    str(s["outlier_count"]),
                    f"{s['outlier_pct']}%",
                ]
                for s in summary
            ]
            story.append(_styled_table(rows, col_widths=[4, 3.5, 3.5, 2.5, 3]))
            story.append(Paragraph(
                f"Total rows with at least one outlier: {outlier_data['total_outlier_rows']}",
                body_style
            ))
        else:
            story.append(Paragraph("No numeric columns for outlier detection.", body_style))
    except Exception as e:
        story.append(Paragraph(f"Could not detect outliers: {e}", body_style))

    story.append(Spacer(1, 0.4 * cm))

    # ── Revenue Trend ──────────────────────────────────────────────────────
    story.append(Paragraph("6. Revenue Trend Summary", section_style))
    try:
        rev_trend = kpi_data.get("revenue_trend", [])
        monthly = kpi_data.get("monthly_trend", [])
        if monthly:
            headers = ["Month", "Total Revenue", "Avg Revenue", "Transactions"]
            rows = [headers] + [
                [
                    m["month"],
                    f"₹{m['total_revenue']:,.2f}",
                    f"₹{m['avg_revenue']:,.2f}",
                    str(m["transactions"]),
                ]
                for m in monthly
            ]
            story.append(_styled_table(rows, col_widths=[4, 4, 4, 4]))
        else:
            story.append(Paragraph("No date/revenue columns detected for trend analysis.", body_style))
    except Exception as e:
        story.append(Paragraph(f"Could not load revenue trend: {e}", body_style))

    story.append(Spacer(1, 0.4 * cm))

    # ── Key Insights ───────────────────────────────────────────────────────
    story.append(Paragraph("7. Key Insights & Recommendations", section_style))
    insights = _generate_insights(store, kpi_data if "kpi_data" in dir() else {})
    for insight in insights:
        story.append(Paragraph(f"• {insight}", body_style))

    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=MUTED))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(
        "Generated by IntelliDash — AI-Powered Business Analytics Platform",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=MUTED, alignment=TA_CENTER)
    ))
    story.append(Paragraph(
        "Aryan Chandak | 1DT22CG007 | DSATM, Bengaluru | VTU",
        ParagraphStyle("Footer2", parent=styles["Normal"], fontSize=8, textColor=MUTED, alignment=TA_CENTER)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def _styled_table(rows: list, col_widths: list = None) -> Table:
    """Create a styled ReportLab table."""
    page_width = A4[0] - 4 * cm
    if col_widths:
        cw = [w * cm for w in col_widths]
    else:
        n = len(rows[0]) if rows else 1
        cw = [page_width / n] * n

    table = Table(rows, colWidths=cw, repeatRows=1)
    style = TableStyle([
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        # Body rows
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), WHITE]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ])
    table.setStyle(style)
    return table


def _generate_insights(store: dict, kpi_data: dict) -> list:
    insights = []
    try:
        kpis = kpi_data.get("kpis", {})
        if kpis.get("quality_score", 0) >= 90:
            insights.append("Dataset quality is excellent (≥90%). The data is highly reliable for analysis.")
        elif kpis.get("quality_score", 0) >= 70:
            insights.append("Dataset quality is good (70–90%). Minor data cleaning may improve model accuracy.")
        else:
            insights.append("Dataset quality is below 70%. Significant preprocessing is recommended before modelling.")

        if kpis.get("missing_pct", 0) > 5:
            insights.append(f"Missing data rate is {kpis['missing_pct']}%. Consider imputation strategies for better coverage.")
        else:
            insights.append("Missing data rate is low (<5%), indicating a well-maintained dataset.")

        monthly = kpi_data.get("monthly_trend", [])
        if monthly and len(monthly) >= 2:
            first_rev = monthly[0]["total_revenue"]
            last_rev = monthly[-1]["total_revenue"]
            change = ((last_rev - first_rev) / first_rev * 100) if first_rev else 0
            direction = "increased" if change > 0 else "decreased"
            insights.append(
                f"Revenue {direction} by {abs(change):.1f}% from {monthly[0]['month']} to {monthly[-1]['month']}."
            )

        regions = kpi_data.get("sales_by_region", [])
        if regions:
            top_region = regions[0]["region"]
            insights.append(f"Top performing region: {top_region} with highest total revenue contribution.")

        seg = kpi_data.get("customer_segmentation", [])
        if seg:
            top_seg = seg[0]["segment"]
            insights.append(f"Dominant customer segment: {top_seg}. Targeted campaigns for this segment may yield high ROI.")

    except Exception:
        pass

    if not insights:
        insights.append("Load a dataset and run analysis to generate data-driven insights.")

    return insights
