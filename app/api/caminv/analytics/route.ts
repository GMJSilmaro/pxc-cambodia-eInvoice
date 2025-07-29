import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getInvoiceAnalytics } from '@/lib/caminv/analytics-service';

/**
 * GET /api/caminv/analytics
 * 
 * Get comprehensive invoice analytics for the current team
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const team = await getTeamForUser(user.id);
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Get analytics data
    const analytics = await getInvoiceAnalytics(team.id);

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Failed to fetch invoice analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
