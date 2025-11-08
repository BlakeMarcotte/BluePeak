import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { OnePagerTemplate } from '@/components/pdf/OnePagerTemplate';
import { BoldImpactTemplate } from '@/components/pdf/BoldImpactTemplate';
import { CorporateProfessionalTemplate } from '@/components/pdf/CorporateProfessionalTemplate';
import { CreativeGeometricTemplate } from '@/components/pdf/CreativeGeometricTemplate';
import { PDFOnePagerData, BrandProfile, PDFTemplate } from '@/types';

interface RenderPDFRequest {
  pdfData: PDFOnePagerData;
  brandProfile?: BrandProfile;
  logoUrl?: string;
  clientName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RenderPDFRequest = await request.json();
    const { pdfData, brandProfile, logoUrl, clientName } = body;

    if (!pdfData || !clientName) {
      return NextResponse.json(
        { error: 'PDF data and client name are required' },
        { status: 400 }
      );
    }

    // Select template based on pdfData.template (default to modern-minimal)
    const template = pdfData.template || 'modern-minimal';
    const templateProps = {
      data: pdfData,
      brandProfile,
      logoUrl,
      clientName,
    };

    let templateComponent;
    switch (template) {
      case 'bold-impact':
        templateComponent = BoldImpactTemplate(templateProps);
        break;
      case 'corporate-professional':
        templateComponent = CorporateProfessionalTemplate(templateProps);
        break;
      case 'creative-geometric':
        templateComponent = CreativeGeometricTemplate(templateProps);
        break;
      case 'modern-minimal':
      default:
        templateComponent = OnePagerTemplate(templateProps);
        break;
    }

    // Render the selected PDF template to buffer
    const pdfBuffer = await renderToBuffer(templateComponent);

    // Return PDF as downloadable file
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${clientName.replace(/[^a-z0-9]/gi, '_')}_OnePager.pdf"`
    );

    return new NextResponse(pdfBuffer, { headers });
  } catch (error) {
    console.error('Error rendering PDF:', error);
    return NextResponse.json(
      { error: 'Failed to render PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
