import type { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument } from 'pdf-lib';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

interface CompressResponse {
  success: boolean;
  data?: string; 
  originalSize?: number;
  compressedSize?: number;
  reduction?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompressResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { pdfData, level } = req.body;

    if (!pdfData) {
      return res.status(400).json({ success: false, error: 'No PDF data provided' });
    }

    // Decode base64 PDF
    const pdfBuffer = Buffer.from(pdfData.split(',')[1] || pdfData, 'base64');
    const originalSize = pdfBuffer.length;

    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Compression settings - more aggressive
    const compressionSettings = {
      low: { 
        objectsPerTick: 100,
        compress: true 
      },
      medium: { 
        objectsPerTick: 200,
        compress: true 
      },
      high: { 
        objectsPerTick: 500,
        compress: true 
      },
    };

    const settings = compressionSettings[level as keyof typeof compressionSettings] || compressionSettings.medium;

    // Save with maximum compression options
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: settings.objectsPerTick,
      updateFieldAppearances: false,
    });

    const compressedSize = compressedPdfBytes.length;
    const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    // Convert to base64
    const base64Pdf = Buffer.from(compressedPdfBytes).toString('base64');

    return res.status(200).json({
      success: true,
      data: `data:application/pdf;base64,${base64Pdf}`,
      originalSize,
      compressedSize,
      reduction: reduction > 0 ? reduction : 0,
    });
  } catch (error) {
    console.error('Compression error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compress PDF',
    });
  }
}
