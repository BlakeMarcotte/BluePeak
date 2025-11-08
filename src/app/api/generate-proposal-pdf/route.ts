import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';
import { jsPDF } from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const proposalData = await request.json();

    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Helper function to add text with wrapping
    const addText = (text: string, fontSize: number, color: string, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color);
      if (isBold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');

      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += fontSize * 0.5;
      });
      yPos += 5;
    };

    // Header
    doc.setFillColor(124, 58, 237); // Purple
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BluePeak Marketing', margin, 20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Marketing Proposal for ${proposalData.clientName}`, margin, 30);

    yPos = 55;

    // Executive Summary
    addText('Executive Summary', 16, '#1f2937', true);
    addText(proposalData.executiveSummary, 11, '#374151');

    // Scope of Work
    addText('Scope of Work', 16, '#1f2937', true);
    addText(proposalData.scopeOfWork.replace(/<[^>]*>/g, '\n'), 11, '#374151');

    // Timeline
    addText('Timeline', 16, '#1f2937', true);
    addText(proposalData.timeline.replace(/<[^>]*>/g, '\n'), 11, '#374151');

    // Investment
    addText('Investment', 16, '#1f2937', true);
    addText(proposalData.pricing.replace(/<[^>]*>/g, '\n'), 11, '#374151');

    // Deliverables
    addText('Deliverables', 16, '#1f2937', true);
    proposalData.deliverables.forEach((item: string) => {
      addText(`• ${item}`, 11, '#374151');
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor('#9ca3af');
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | BluePeak Marketing | hello@bluepeak.com`,
      pageWidth / 2,
      280,
      { align: 'center' }
    );

    // Get PDF as base64 for storing in database
    const pdfBase64 = doc.output('datauristring');

    return NextResponse.json({
      pdfData: pdfBase64, // Data URI that can be used directly in browser
      filename: `${proposalData.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_proposal.pdf`,
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
