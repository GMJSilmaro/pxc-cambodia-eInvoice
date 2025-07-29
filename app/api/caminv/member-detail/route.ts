import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvCoreService } from '@/lib/caminv/core-service';
import { getPrimaryMerchantForTeam } from '@/lib/caminv/team-merchant-helper';

/**
 * GET /api/caminv/member-detail
 * 
 * Get member detail information using CamInv API
 * 
 * Query Parameters:
 * - endpoint_id: Optional. The CamInv endpoint ID to lookup. If not provided, uses the merchant's own endpoint ID.
 */
export async function GET(request: NextRequest) {
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

    // Get optional endpoint_id from query parameters
    const { searchParams } = new URL(request.url);
    const endpointId = searchParams.get('endpoint_id') || undefined;

    // Get member detail using CamInv API
    const result = await camInvCoreService.getMemberDetail(
      merchantId,
      endpointId,
      user.id
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error?.message || 'Failed to get member detail' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      member: result.data
    });

  } catch (error) {
    console.error('Member detail error:', error);
    return NextResponse.json({ 
      error: 'Internal server error while getting member detail' 
    }, { status: 500 });
  }
}
