import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  versionHistory, 
  getCurrentVersion, 
  getTypeIcon, 
  getTypeLabel, 
  getTypeColor 
} from '@/lib/updates/version-data';

export default function UpdatesPage() {
  const currentVersion = getCurrentVersion();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild className="border-green-200 text-green-700 hover:bg-green-50">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600 text-white shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-green-800">What's New</h1>
            <p className="text-green-600">Version history and updates for PXC Cambodia E-Invoice Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-green-500">
          <Badge variant="outline" className="bg-green-600 text-white border-green-600 shadow-sm">
            Current: v{currentVersion}
          </Badge>
        </div>
      </div>

      {/* Version History */}
      <div className="space-y-8">
        {versionHistory.map((version, index) => (
          <Card key={version.version} className={`border-green-200 ${version.isHighlight ? 'ring-2 ring-green-500 ring-opacity-30 bg-green-50' : 'bg-white'} shadow-sm hover:shadow-md transition-shadow`}>
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl text-green-800">
                      v{version.version}
                      {index === 0 && (
                        <Badge className="ml-2 bg-green-600 text-white shadow-sm">Latest</Badge>
                      )}
                      {version.isHighlight && (
                        <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-300">
                          Major Update
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium text-green-700">
                    {version.title}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Calendar className="h-4 w-4" />
                    <span>Released on {new Date(version.releaseDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 bg-white">
              <p className="text-green-700 leading-relaxed">
                {version.description}
              </p>

              <Separator className="bg-green-200" />

              <div className="space-y-4">
                <h3 className="font-semibold text-green-800">Updates in this version</h3>
                <div className="grid gap-3">
                  {version.updates.map((update) => (
                    <div key={update.id} className="flex gap-3 p-4 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                      <div className="flex-shrink-0 text-xl">
                        {update.icon || getTypeIcon(update.type)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-green-800">{update.title}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTypeColor(update.type)}`}
                          >
                            {getTypeLabel(update.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-green-600 leading-relaxed">
                          {update.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 shadow-sm">
          <Sparkles className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600">
            Stay tuned for more updates and improvements!
          </span>
        </div>
      </div>
    </div>
  );
}
