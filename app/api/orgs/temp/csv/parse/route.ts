import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse CSV
    const csvText = await file.text();
    const { parse } = await import('csv-parse/sync');
    
    let records: any[];
    let headers: string[];

    try {
      const parsed = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      records = parsed;
      headers = Object.keys(records[0] || {});
    } catch (error) {
      return NextResponse.json({ error: 'Failed to parse CSV file' }, { status: 400 });
    }

    // Normalize headers
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
    const columnMapping: Record<string, string> = {};
    
    // Map synonyms
    const leadSynonyms = ['conversions', 'leads', 'results', 'conversion'];
    const spendSynonyms = ['cost', 'spend', 'costs'];
    const revenueSynonyms = ['value', 'conv_value', 'revenue', 'revenues'];
    const dateSynonyms = ['day', 'date', 'timestamp', 'time'];

    let leadsColumn: string | null = null;
    let spendColumn: string | null = null;
    let revenueColumn: string | null = null;
    let dateColumn: string | null = null;

    normalizedHeaders.forEach((normalized, index) => {
      const original = headers[index];
      columnMapping[normalized] = original;

      if (leadSynonyms.some(syn => normalized.includes(syn)) && !leadsColumn) {
        leadsColumn = normalized;
      }
      if (spendSynonyms.some(syn => normalized.includes(syn)) && !spendColumn) {
        spendColumn = normalized;
      }
      if (revenueSynonyms.some(syn => normalized.includes(syn)) && !revenueColumn) {
        revenueColumn = normalized;
      }
      if (dateSynonyms.some(syn => normalized.includes(syn)) && !dateColumn) {
        dateColumn = normalized;
      }
    });

    // Aggregate totals (sample first 100 rows for preview)
    const sampleRecords = records.slice(0, 100);
    let totalLeads = 0;
    let totalSpend = 0;
    let totalRevenue = 0;

    sampleRecords.forEach((record: any) => {
      if (leadsColumn && record[columnMapping[leadsColumn]]) {
        totalLeads += parseInt(record[columnMapping[leadsColumn]]) || 0;
      }
      if (spendColumn && record[columnMapping[spendColumn]]) {
        totalSpend += parseFloat(record[columnMapping[spendColumn]]) || 0;
      }
      if (revenueColumn && record[columnMapping[revenueColumn]]) {
        totalRevenue += parseFloat(record[columnMapping[revenueColumn]]) || 0;
      }
    });

    // Calculate KPIs
    const cpl = totalSpend > 0 && totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : null;
    const roas = totalSpend > 0 && totalRevenue > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : null;

    return NextResponse.json({
      data: {
        totals: {
          leads: totalLeads,
          spend: totalSpend,
          revenue: totalRevenue,
          cpl,
          roas,
        },
        columnMapping,
        rowCount: records.length,
      },
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to parse CSV file' },
      { status: 500 }
    );
  }
}

