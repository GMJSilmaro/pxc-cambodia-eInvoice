'use client'

import { Suspense } from 'react'

// Import the existing team settings components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, UserPlus, Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import useSWR, { mutate } from 'swr'
import { User, TeamDataWithMembers } from '@/lib/db/schema'
import {
  inviteTeamMember,
  removeTeamMember
} from '@/app/(login)/actions'
import { customerPortalAction } from '@/lib/payments/actions'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Team Settings Components (copied from existing dashboard)
function ManageSubscription() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher)

  if (!teamData) {
    return <div>Loading...</div>
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Current Plan</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline">
                {teamData.planName || 'Free'}
              </Badge>
            </div>
          </div>
          <form action={customerPortalAction}>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Manage Subscription
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamMembers() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher)

  if (!teamData) {
    return <div>Loading...</div>
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamData.teamMembers.map((member) => (
            <TeamMemberRow key={member.id} member={member} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TeamMemberRow({ member }: { member: any }) {
  const [state, formAction, isPending] = useActionState(removeTeamMember, {
    message: ''
  })

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {member.user.name?.charAt(0) || member.user.email.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{member.user.name || 'Unnamed'}</p>
          <p className="text-sm text-gray-500">{member.user.email}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant="outline">{member.role}</Badge>
        {member.role !== 'owner' && (
          <form action={formAction}>
            <input type="hidden" name="memberId" value={member.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

function InviteTeamMember() {
  const [state, formAction, isPending] = useActionState(inviteTeamMember, {
    message: ''
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="colleague@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {state?.message && (
            <p className="text-sm text-gray-600">{state.message}</p>
          )}
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Skeleton components
function SubscriptionSkeleton() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamMembersSkeleton() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function InviteTeamMemberSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg lg:text-2xl font-medium">Team Settings</h1>
      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      <Suspense fallback={<TeamMembersSkeleton />}>
        <TeamMembers />
      </Suspense>
      <Suspense fallback={<InviteTeamMemberSkeleton />}>
        <InviteTeamMember />
      </Suspense>
    </div>
  )
}
