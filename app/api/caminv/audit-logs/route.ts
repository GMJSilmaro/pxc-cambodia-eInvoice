import { NextRequest, NextResponse } from 'next/server'
import { desc, and, eq, like, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { camInvAuditLogs, users, teamMembers } from '@/lib/db/schema'
import { getUser } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const teamMember = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1)

    if (teamMember.length === 0) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 })
    }

    const teamId = teamMember[0].teamId
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const search = searchParams.get('search')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where conditions
    const conditions = [eq(camInvAuditLogs.teamId, teamId)]

    if (search) {
      // Search in action, entity type, and details
      conditions.push(
        or(
          like(camInvAuditLogs.action, `%${search}%`),
          like(camInvAuditLogs.entityType, `%${search}%`),
          sql`${camInvAuditLogs.details}::text ILIKE ${'%' + search + '%'}`
        )
      )
    }

    if (action) {
      conditions.push(eq(camInvAuditLogs.action, action))
    }

    if (entity) {
      conditions.push(eq(camInvAuditLogs.entityType, entity))
    }

    // Fetch audit logs with user information
    const logs = await db
      .select({
        id: camInvAuditLogs.id,
        action: camInvAuditLogs.action,
        entityType: camInvAuditLogs.entityType,
        entityId: camInvAuditLogs.entityId,
        details: camInvAuditLogs.details,
        createdAt: camInvAuditLogs.createdAt,
        ipAddress: camInvAuditLogs.ipAddress,
        userAgent: camInvAuditLogs.userAgent,
        userName: users.name,
        userEmail: users.email,
      })
      .from(camInvAuditLogs)
      .leftJoin(users, eq(camInvAuditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(camInvAuditLogs.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(camInvAuditLogs)
      .where(and(...conditions))

    const totalCount = totalCountResult[0]?.count || 0

    // Format the response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      userName: log.userName,
      userEmail: log.userEmail,
    }))

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })

  } catch (error) {
    console.error('Failed to fetch CamInv audit logs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch audit logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Optional: Add POST endpoint for manual audit log creation (for testing)
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const teamMember = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1)

    if (teamMember.length === 0) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 })
    }

    const teamId = teamMember[0].teamId
    const body = await request.json()
    
    const { action, entityType, entityId, details } = body

    if (!action || !entityType) {
      return NextResponse.json(
        { error: 'Action and entityType are required' },
        { status: 400 }
      )
    }

    // Create audit log entry
    const newLog = await db
      .insert(camInvAuditLogs)
      .values({
        teamId,
        userId: user.id,
        action,
        entityType,
        entityId: entityId || null,
        details: details || null,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      })
      .returning()

    return NextResponse.json({
      success: true,
      log: newLog[0],
    })

  } catch (error) {
    console.error('Failed to create audit log:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create audit log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
