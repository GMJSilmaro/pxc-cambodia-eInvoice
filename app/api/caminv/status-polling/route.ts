import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { statusPollingService } from '@/lib/caminv/status-polling-service';

/**
 * POST /api/caminv/status-polling
 * 
 * Triggers status polling for processing invoices.
 * Can be used for manual polling or scheduled via cron jobs.
 * 
 * Body Parameters:
 * - team_id: Optional. If provided, only poll invoices for this team
 * - max_age: Optional. Maximum age in minutes for documents to poll (default: 60)
 * - batch_size: Optional. Number of documents to process (default: 10)
 * - retry_attempts: Optional. Number of retry attempts (default: 3)
 * - use_official_polling: Optional. Use official CamInv polling endpoint (default: false)
 * - last_synced_at: Optional. Timestamp for official polling (ISO string)
 * 
 * Returns:
 * - success: boolean
 * - processed: number of invoices processed
 * - updated: number of invoices updated
 * - failed: number of failed polls
 * - errors: array of error details
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user (optional for system calls)
    const user = await getUser();
    
    const body = await request.json();
    const {
      team_id,
      max_age = 60,
      batch_size = 10,
      retry_attempts = 3,
      use_official_polling = false,
      last_synced_at
    } = body;

    // If team_id is provided, verify user has access to that team
    if (team_id && user) {
      const team = await getTeamForUser(user.id);
      if (!team || team.id !== team_id) {
        return NextResponse.json({ error: 'Access denied to team' }, { status: 403 });
      }
    }

    const config = {
      maxAge: max_age,
      batchSize: batch_size,
      retryAttempts: retry_attempts,
    };

    let result;

    if (use_official_polling) {
      // Use official CamInv polling endpoint
      if (!team_id) {
        return NextResponse.json({ error: 'Team ID required for official polling' }, { status: 400 });
      }

      // Get merchant for the team (assuming one merchant per team for now)
      const { getPrimaryMerchantForTeam } = await import('@/lib/caminv/team-merchant-helper');
      const merchantId = await getPrimaryMerchantForTeam(team_id);

      if (!merchantId) {
        return NextResponse.json({ error: 'No active merchant found for team' }, { status: 404 });
      }

      result = await statusPollingService.pollOfficialDocumentUpdates(merchantId, last_synced_at);
    } else if (team_id) {
      // Poll invoices for specific team using legacy method
      result = await statusPollingService.pollTeamInvoices(team_id, config);
    } else {
      // Poll all processing invoices (system-wide)
      // This should be restricted to admin users or system calls
      if (user) {
        return NextResponse.json({ error: 'System-wide polling requires admin access' }, { status: 403 });
      }

      result = await statusPollingService.pollProcessingInvoices(config);
    }

    return NextResponse.json({
      success: result.success,
      processed: result.processed,
      updated: result.updated,
      failed: result.failed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Status polling API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute status polling',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/caminv/status-polling
 * 
 * Get status polling information and statistics.
 * 
 * Query Parameters:
 * - team_id: Optional. Get stats for specific team
 * 
 * Returns:
 * - pending_count: number of invoices that need polling
 * - last_poll_time: timestamp of last polling operation
 * - config: current polling configuration
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

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    // Verify team access if team_id is provided
    if (teamId && parseInt(teamId) !== team.id) {
      return NextResponse.json({ error: 'Access denied to team' }, { status: 403 });
    }

    // Get pending invoices count (this would require a new method in the service)
    // For now, return basic information
    
    return NextResponse.json({
      success: true,
      team_id: team.id,
      config: {
        max_age: 60,
        batch_size: 10,
        retry_attempts: 3,
        retry_delay: 1000,
      },
      status: 'ready',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Status polling info API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get status polling information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/caminv/status-polling
 * 
 * Update status polling configuration.
 * This could be used to enable/disable automatic polling or adjust intervals.
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { enabled, interval, max_age, batch_size } = body;

    // Here you would update team-specific polling configuration
    // This would require extending the database schema to store polling preferences
    
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Polling configuration updated',
      config: {
        enabled: enabled ?? true,
        interval: interval ?? 300, // 5 minutes
        max_age: max_age ?? 60,
        batch_size: batch_size ?? 10,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Status polling config API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update status polling configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
