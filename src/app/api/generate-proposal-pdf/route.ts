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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const bottomMargin = 30; // Space for footer
    let yPos = margin;

    // Helper function to parse and add formatted text with full markdown support
    const addFormattedText = (text: string, fontSize: number, color: string) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color);

      // Split by newlines to handle each line
      const lines = text.split('\n');

      lines.forEach((line) => {
        let trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) {
          yPos += 2;
          return;
        }

        // Remove leading colons and spaces (e.g., ": 12 Weeks" → "12 Weeks")
        trimmedLine = trimmedLine.replace(/^:\s*/, '');

        // MARKDOWN HEADERS - Check in order: ###, ##, # (most specific first)
        let headerMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
        if (headerMatch) {
          const hashCount = headerMatch[1].length;
          const headerText = headerMatch[2]; // Text without the hashes

          doc.setFont('helvetica', 'bold');

          // Set font size based on header level
          if (hashCount === 1) {
            doc.setFontSize(14); // # Header
          } else if (hashCount === 2) {
            doc.setFontSize(13); // ## Header
          } else {
            doc.setFontSize(12); // ### Header
          }

          if (yPos > pageHeight - bottomMargin - 15) {
            doc.addPage();
            yPos = margin;
          }

          doc.text(headerText, margin, yPos);
          yPos += (hashCount === 1 ? 8 : 7);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize); // Reset to original size
          return;
        }

        // BULLET POINTS - Check if line starts with -, *, or •
        const bulletMatch = trimmedLine.match(/^[\-\*•]\s+(.+)$/);
        if (bulletMatch) {
          const bulletText = bulletMatch[1];

          // Clean markdown from bullet text (remove ** for bold)
          const cleanText = bulletText.replace(/\*\*/g, '');

          // Add bullet symbol
          doc.setFont('helvetica', 'normal');
          doc.text('•', margin, yPos);

          // Wrap the bullet text to fit within margins
          const bulletContentWidth = maxWidth - 5; // Account for bullet indentation
          const wrappedLines = doc.splitTextToSize(cleanText, bulletContentWidth);

          // Render each wrapped line with proper indentation
          wrappedLines.forEach((wrappedLine: string, index: number) => {
            if (yPos > pageHeight - bottomMargin) {
              doc.addPage();
              yPos = margin;
              if (index === 0) {
                doc.text('•', margin, yPos);
              }
            }
            doc.text(wrappedLine, margin + 5, yPos);
            if (index < wrappedLines.length - 1) {
              yPos += fontSize * 0.5;
            }
          });

          yPos += fontSize * 0.5 + 2;
          return;
        }

        // REGULAR TEXT with **bold** support
        // Split text by **bold** markers
        const boldPattern = /(\*\*[^*]+\*\*)/g;
        const parts = trimmedLine.split(boldPattern);

        parts.forEach((part) => {
          if (!part) return;

          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text - remove ** markers
            const boldText = part.replace(/\*\*/g, '');
            doc.setFont('helvetica', 'bold');
            const wrappedLines = doc.splitTextToSize(boldText, maxWidth);
            wrappedLines.forEach((wrappedLine: string) => {
              if (yPos > pageHeight - bottomMargin) {
                doc.addPage();
                yPos = margin;
              }
              doc.text(wrappedLine, margin, yPos);
              yPos += fontSize * 0.5;
            });
            doc.setFont('helvetica', 'normal');
          } else {
            // Normal text
            doc.setFont('helvetica', 'normal');
            const wrappedLines = doc.splitTextToSize(part, maxWidth);
            wrappedLines.forEach((wrappedLine: string) => {
              if (yPos > pageHeight - bottomMargin) {
                doc.addPage();
                yPos = margin;
              }
              doc.text(wrappedLine, margin, yPos);
              yPos += fontSize * 0.5;
            });
          }
        });

        yPos += 3;
      });

      yPos += 2;
    };

    // Helper function for headers
    const addHeader = (text: string) => {
      if (yPos > pageHeight - bottomMargin - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFontSize(16);
      doc.setTextColor('#1f2937');
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, yPos);
      yPos += 8;
    };

    // Header (no background color)
    doc.setTextColor(31, 41, 55); // Dark gray text
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BluePeak Marketing', margin, 25);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Marketing Proposal for ${proposalData.clientName}`, margin, 35);

    // Add client logo if provided
    if (proposalData.logoUrl) {
      try {
        console.log('📷 Fetching logo from:', proposalData.logoUrl);

        // Fetch the logo from Firebase Storage
        const logoResponse = await fetch(proposalData.logoUrl);

        if (!logoResponse.ok) {
          throw new Error(`Failed to fetch logo: ${logoResponse.status}`);
        }

        const logoBlob = await logoResponse.blob();
        console.log('📷 Logo blob type:', logoBlob.type, 'size:', logoBlob.size);

        // Convert blob to buffer (Node.js compatible)
        const arrayBuffer = await logoBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Detect image format from blob type
        let imageFormat = 'PNG';
        let mimeType = 'image/png';

        if (logoBlob.type.includes('jpeg') || logoBlob.type.includes('jpg')) {
          imageFormat = 'JPEG';
          mimeType = 'image/jpeg';
        } else if (logoBlob.type.includes('webp')) {
          imageFormat = 'WEBP';
          mimeType = 'image/webp';
        } else if (logoBlob.type.includes('png')) {
          imageFormat = 'PNG';
          mimeType = 'image/png';
        }

        console.log('📷 Detected image format:', imageFormat);

        // Create base64 data URI
        const logoBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

        // Add logo to top right of header (transparent background)
        const logoSize = 25; // mm
        const logoX = pageWidth - margin - logoSize;
        const logoY = 12; // Adjusted for no-background header

        // Add logo image (no background - let transparency show through)
        doc.addImage(logoBase64, imageFormat, logoX, logoY, logoSize, logoSize);
        console.log('✅ Logo added successfully to PDF');
      } catch (logoError) {
        console.error('❌ Failed to add logo to PDF:', logoError);
        // Continue without logo if there's an error
      }
    } else {
      console.log('ℹ️ No logo URL provided');
    }

    yPos = 55;

    // Executive Summary
    addHeader('Executive Summary');
    addFormattedText(proposalData.executiveSummary, 11, '#374151');

    // Scope of Work
    addHeader('Scope of Work');
    addFormattedText(proposalData.scopeOfWork, 11, '#374151');

    // Timeline
    addHeader('Timeline');
    addFormattedText(proposalData.timeline, 11, '#374151');

    // Investment
    addHeader('Investment');
    addFormattedText(proposalData.pricing, 11, '#374151');

    // Deliverables
    addHeader('Deliverables');
    proposalData.deliverables.forEach((item: string) => {
      addFormattedText(`• ${item}`, 11, '#374151');
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
