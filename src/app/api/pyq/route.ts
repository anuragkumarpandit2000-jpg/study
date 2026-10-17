import { NextResponse } from 'next/server';
import { pyqService } from '@/lib/pyq-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const catalog = pyqService.getCatalog();
    return NextResponse.json({
      success: true,
      catalog
    });
  } catch (error: any) {
    console.error('Error fetching PYQ catalog:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to scan PYQ catalog' },
      { status: 500 }
    );
  }
}
