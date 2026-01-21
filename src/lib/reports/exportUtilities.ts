import { jsPDF } from 'jspdf';
import type { ReconciliationReport } from '../ai/reportGenerator';

// Participation data for credits page
export interface SessionParticipation {
  sessionCode: string;
  challengeWinners?: Array<{
    name: string;
    challenge: string;
    time?: number;
    score?: number;
  }>;
  scanContributors?: Array<{
    name: string;
    unitsScanned: number;
  }>;
  totalParticipants?: number;
  errorsPreventedValue?: number;
  timeSavedMinutes?: number;
}

/**
 * Generate a professional PDF report from ReconciliationReport data
 */
export function generatePDF(
  report: ReconciliationReport,
  participation?: SessionParticipation
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // Colors - neutral palette with NEI green accent
  const neiGreen = [26, 77, 77]; // #1a4d4d
  const darkGray = [51, 51, 51];
  const lightGray = [128, 128, 128];
  const green = [34, 197, 94];
  const amber = [217, 119, 6];
  const red = [220, 38, 38];

  // Helper to add text with wrapping
  const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string, index: number) => {
      doc.text(line, x, startY + index * lineHeight);
    });
    return startY + lines.length * lineHeight;
  };

  // Header - clean, unbranded with subtle accent line
  doc.setFillColor(neiGreen[0], neiGreen[1], neiGreen[2]);
  doc.rect(0, 0, pageWidth, 4, 'F'); // Thin accent line at top

  // Report title as main header
  y = 50;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Reconciliation Report', margin, y);

  // Date on the right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text(
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  y += 15;

  // Subtle separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 30;

  // Report Title (use the one from report data)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(report.title, margin, y);
  y += 25;

  // Executive Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('Executive Summary', margin, y);
  y += 18;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  y = addWrappedText(report.executiveSummary, margin, y, contentWidth, 16);
  y += 25;

  // Statistics Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('Processing Statistics', margin, y);
  y += 20;

  // Stats boxes
  const boxWidth = (contentWidth - 30) / 4;
  const boxHeight = 60;
  const stats = [
    { label: 'Total Processed', value: report.statistics.totalProcessed.toString(), color: neiGreen },
    { label: 'Clean Matches', value: report.statistics.cleanMatches.toString(), color: green },
    { label: 'Discrepancies', value: report.statistics.discrepanciesFound.toString(), color: amber },
    { label: 'Avg Confidence', value: `${report.statistics.avgConfidence}%`, color: neiGreen },
  ];

  stats.forEach((stat, index) => {
    const x = margin + index * (boxWidth + 10);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, y, boxWidth, boxHeight, 5, 5, 'F');

    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x + boxWidth / 2, y + 28, { align: 'center' });

    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, x + boxWidth / 2, y + 48, { align: 'center' });
  });
  y += boxHeight + 25;

  // Clean Shipments
  if (report.cleanShipments.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Successfully Matched Shipments', margin, y);
    y += 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(green[0], green[1], green[2]);
    const shipmentText = report.cleanShipments.join(', ');
    y = addWrappedText(shipmentText, margin, y, contentWidth, 14);
    y += 20;
  }

  // Discrepancies
  if (report.discrepancyDetails.length > 0) {
    // Check if we need a new page
    if (y > 600) {
      doc.addPage();
      y = 50;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Discrepancies Identified', margin, y);
    y += 20;

    report.discrepancyDetails.forEach((disc) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      // Severity badge color
      const severityColor = disc.severity === 'critical' ? red :
                            disc.severity === 'high' ? [234, 88, 12] :
                            amber;

      // Box background
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(margin, y, contentWidth, 70, 5, 5, 'F');

      // Left border
      doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.rect(margin, y, 4, 70, 'F');

      // Shipment ID
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(disc.shipment_id, margin + 15, y + 18);

      // Severity badge
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.text(disc.severity.toUpperCase(), pageWidth - margin - 60, y + 18);

      // Issue
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      const issueLines = doc.splitTextToSize(disc.issue, contentWidth - 40);
      doc.text(issueLines.slice(0, 2), margin + 15, y + 35);

      // Recommendation
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Action: ${disc.recommendation}`, margin + 15, y + 58);

      y += 80;
    });
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    if (y > 600) {
      doc.addPage();
      y = 50;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Process Improvement Recommendations', margin, y);
    y += 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    report.recommendations.forEach((rec, index) => {
      doc.setTextColor(neiGreen[0], neiGreen[1], neiGreen[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      y = addWrappedText(rec, margin + 20, y, contentWidth - 20, 16);
      y += 8;
    });
  }

  // Add Participation Credits Page (if participation data provided)
  if (participation) {
    doc.addPage();
    y = 50;

    // Accent line
    doc.setFillColor(neiGreen[0], neiGreen[1], neiGreen[2]);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Credits header
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Acknowledgments', margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`Session ${participation.sessionCode}`, margin, y);
    y += 30;

    // Challenge Winners
    if (participation.challengeWinners && participation.challengeWinners.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(neiGreen[0], neiGreen[1], neiGreen[2]);
      doc.text('Challenge Winners', margin, y);
      y += 20;

      participation.challengeWinners.forEach((winner, index) => {
        const medal = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;

        doc.setFillColor(index === 0 ? 255 : 250, index === 0 ? 215 : 250, index === 0 ? 0 : 250);
        doc.roundedRect(margin, y - 12, contentWidth, 35, 5, 5, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(`${medal}`, margin + 15, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.text(winner.name, margin + 50, y + 5);

        doc.setFontSize(10);
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.text(winner.challenge, margin + 50, y + 18);

        if (winner.time) {
          doc.setTextColor(neiGreen[0], neiGreen[1], neiGreen[2]);
          doc.text(`${winner.time.toFixed(1)}s`, pageWidth - margin - 40, y + 5);
        }

        y += 45;
      });
      y += 10;
    }

    // Scan Contributors
    if (participation.scanContributors && participation.scanContributors.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(neiGreen[0], neiGreen[1], neiGreen[2]);
      doc.text('Scan Contributors', margin, y);
      y += 20;

      participation.scanContributors.forEach((contributor) => {
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(margin, y - 10, contentWidth, 28, 4, 4, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(contributor.name, margin + 15, y + 5);

        doc.setTextColor(green[0], green[1], green[2]);
        doc.text(`${contributor.unitsScanned} units scanned`, pageWidth - margin - 100, y + 5);

        y += 35;
      });
      y += 10;
    }

    // Value Generated Section
    if (participation.errorsPreventedValue || participation.timeSavedMinutes) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(neiGreen[0], neiGreen[1], neiGreen[2]);
      doc.text('Value Generated', margin, y);
      y += 25;

      doc.setFillColor(neiGreen[0], neiGreen[1], neiGreen[2]);
      doc.roundedRect(margin, y - 5, contentWidth, 70, 8, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');

      const valueText = [];
      if (participation.errorsPreventedValue) {
        valueText.push(`By catching discrepancies in this session, an estimated $${participation.errorsPreventedValue.toLocaleString()} in receiving errors was prevented.`);
      }
      if (participation.timeSavedMinutes) {
        valueText.push(`Automated processing saved approximately ${participation.timeSavedMinutes} minutes of manual reconciliation time.`);
      }

      let valueY = y + 20;
      valueText.forEach(text => {
        const lines = doc.splitTextToSize(text, contentWidth - 30);
        doc.text(lines, margin + 15, valueY);
        valueY += lines.length * 14 + 10;
      });
    }
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setFont('helvetica', 'normal');

    // Subtle NEI credit
    doc.text(
      'New Era',
      margin,
      pageHeight - 30
    );

    // Page number
    doc.text(
      `${i} / ${totalPages}`,
      pageWidth - margin,
      pageHeight - 30,
      { align: 'right' }
    );
  }

  return doc.output('blob');
}

/**
 * Generate a CSV export of discrepancy data
 */
export function generateDiscrepancyCSV(report: ReconciliationReport): Blob {
  const headers = ['Shipment ID', 'Issue', 'Severity', 'Recommendation'];
  const rows = report.discrepancyDetails.map(d => [
    d.shipment_id,
    `"${d.issue.replace(/"/g, '""')}"`,
    d.severity,
    `"${d.recommendation.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    `# Reconciliation Report: ${report.title}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total Processed: ${report.statistics.totalProcessed}`,
    `# Clean Matches: ${report.statistics.cleanMatches}`,
    `# Discrepancies: ${report.statistics.discrepanciesFound}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Generate a CSV export of all shipment data
 */
export function generateFullDataCSV(report: ReconciliationReport): Blob {
  const headers = ['Shipment ID', 'Status', 'Issue', 'Severity', 'Recommendation'];

  // Clean shipments
  const cleanRows = report.cleanShipments.map(id => [
    id,
    'Matched',
    '',
    '',
    '',
  ]);

  // Discrepancies
  const discrepancyRows = report.discrepancyDetails.map(d => [
    d.shipment_id,
    'Discrepancy',
    `"${d.issue.replace(/"/g, '""')}"`,
    d.severity,
    `"${d.recommendation.replace(/"/g, '""')}"`,
  ]);

  const allRows = [...cleanRows, ...discrepancyRows];

  const csvContent = [
    `# Full Reconciliation Data Export`,
    `# Report: ${report.title}`,
    `# Generated: ${new Date().toISOString()}`,
    '',
    '# Summary Statistics',
    `Total Processed,${report.statistics.totalProcessed}`,
    `Clean Matches,${report.statistics.cleanMatches}`,
    `Discrepancies Found,${report.statistics.discrepanciesFound}`,
    `Average Confidence,${report.statistics.avgConfidence}%`,
    '',
    '# Shipment Details',
    headers.join(','),
    ...allRows.map(row => row.join(',')),
    '',
    '# Recommendations',
    ...report.recommendations.map((r, i) => `${i + 1},"${r.replace(/"/g, '""')}"`),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create a preview URL for a blob (for PDF preview in iframe)
 */
export function createPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
