import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvCoreService } from '@/lib/caminv/core-service';
import { getPrimaryMerchantForTeam } from '@/lib/caminv/team-merchant-helper';

/**
 * POST /api/caminv/validate-taxpayer
 * 
 * Validate taxpayer information using CamInv API
 * 
 * Body Parameters:
 * - single_id: The single ID of the taxpayer (required)
 * - tin: The taxpayer identification number (TIN) (required)
 * - company_name_en: The company name in English (required)
 * - company_name_kh: The company name in Khmer (required)
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user and team
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get merchant for the team
    const merchantId = await getPrimaryMerchantForTeam(team.id);
    if (!merchantId) {
      return NextResponse.json({ 
        error: 'No active CamInv merchant found for your team. Please connect to CamInv first.' 
      }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { single_id, tin, company_name_en, company_name_kh } = body;

    // Validate required fields
    if (!single_id || !tin || !company_name_en || !company_name_kh) {
      return NextResponse.json({ 
        error: 'Missing required fields: single_id, tin, company_name_en, company_name_kh' 
      }, { status: 400 });
    }

    // Validate taxpayer using CamInv API
    const result = await camInvCoreService.validateTaxpayer(
      merchantId,
      {
        single_id: single_id.toString(),
        tin: tin.toString(),
        company_name_en: company_name_en.toString(),
        company_name_kh: company_name_kh.toString(),
      },
      user.id
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error?.message || 'Failed to validate taxpayer' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      is_valid: result.data?.is_valid || false,
      message: result.data?.is_valid 
        ? 'Taxpayer is registered with CamInv' 
        : 'Taxpayer is not registered with CamInv'
    });

  } catch (error) {
    console.error('Taxpayer validation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during taxpayer validation' 
    }, { status: 500 });
  }
}
