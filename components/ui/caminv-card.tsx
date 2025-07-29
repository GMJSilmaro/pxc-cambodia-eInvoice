import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CamInvCardProps extends React.ComponentProps<"div"> {
  title?: string
  description?: string
  icon?: React.ReactNode
  headerVariant?: "navy" | "default"
  children?: React.ReactNode
}

/**
 * CamInv Card component with consistent navy blue header styling
 * Eliminates the need for inline Tailwind classes in page components
 */
export function CamInvCard({ 
  title, 
  description, 
  icon, 
  headerVariant = "navy",
  children, 
  className,
  ...props 
}: CamInvCardProps) {
  return (
    <Card variant="caminv" className={cn(className)} {...props}>
      {(title || description || icon) && (
        <CardHeader variant={headerVariant === "navy" ? "caminvNavy" : "default"}>
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                {icon}
              </div>
            )}
            {(title || description) && (
              <div>
                {title && (
                  <CardTitle className="text-2xl font-bold text-white mb-1">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <p className="text-slate-300">{description}</p>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent variant="caminv">
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * Simple CamInv Card without header for basic content
 */
export function CamInvSimpleCard({ 
  children, 
  className,
  variant = "caminv",
  ...props 
}: React.ComponentProps<typeof Card> & { variant?: "caminv" | "caminvGlass" | "caminvHover" }) {
  return (
    <Card variant={variant} className={cn(className)} {...props}>
      <CardContent variant="caminv">
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * CamInv Glass Card for special effects
 */
export function CamInvGlassCard({ 
  children, 
  className,
  ...props 
}: React.ComponentProps<typeof Card>) {
  return (
    <Card variant="caminvGlass" className={cn(className)} {...props}>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * CamInv Hover Card for interactive elements
 */
export function CamInvHoverCard({ 
  children, 
  className,
  ...props 
}: React.ComponentProps<typeof Card>) {
  return (
    <Card variant="caminvHover" className={cn(className)} {...props}>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
