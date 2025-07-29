import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm",
  {
    variants: {
      variant: {
        default: "gap-6 py-6",
        caminv: "bg-white border-0 shadow-sm rounded-2xl overflow-hidden",
        caminvGlass: "shadow-sm border-0 bg-white/80 backdrop-blur-sm",
        caminvHover: "shadow-sm border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200",
      },
      size: {
        default: "",
        sm: "gap-4 py-4",
        lg: "gap-8 py-8",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, size, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, size, className }))}
      {...props}
    />
  )
}

const cardHeaderVariants = cva(
  "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
  {
    variants: {
      variant: {
        default: "",
        caminvNavy: "bg-slate-800 text-white p-8 rounded-t-2xl",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardHeaderProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardHeaderVariants> {}

function CardHeader({ className, variant, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(cardHeaderVariants({ variant, className }))}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

const cardContentVariants = cva(
  "px-6",
  {
    variants: {
      variant: {
        default: "",
        caminv: "p-8",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardContentProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardContentVariants> {}

function CardContent({ className, variant, ...props }: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants({ variant, className }))}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
