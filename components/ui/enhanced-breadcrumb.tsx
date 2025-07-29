"use client";

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

interface EnhancedBreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
  separator?: React.ReactNode;
}

// Auto-generate breadcrumbs from pathname
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Define route mappings for better labels
  const routeLabels: Record<string, string> = {
    'caminv': 'CamInv',
    'invoices': 'Invoices',
    'merchants': 'Merchants',
    'settings': 'Settings',
    'create': 'Create',
    'edit': 'Edit',
    'incoming-invoices': 'Incoming Invoices',
    'dashboard': 'Dashboard'
  };

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Skip dashboard segment as it's the root
    if (segment === 'dashboard') return;
    
    // Handle dynamic routes (like [id])
    let label = routeLabels[segment] || segment;
    
    // If it looks like an ID (all numbers), try to get a better label
    if (/^\d+$/.test(segment)) {
      const parentSegment = segments[index - 1];
      if (parentSegment === 'invoices') {
        label = `Invoice ${segment}`;
      } else if (parentSegment === 'merchants') {
        label = `Merchant ${segment}`;
      } else {
        label = `#${segment}`;
      }
    }

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast
    });
  });

  return breadcrumbs;
}

export function EnhancedBreadcrumb({
  items,
  showHome = true,
  showBackButton = false,
  onBack,
  className,
  separator = <ChevronRight className="h-4 w-4 text-gray-400" />
}: EnhancedBreadcrumbProps) {
  const pathname = usePathname();
  
  // Use provided items or auto-generate from pathname
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);
  
  // Don't show breadcrumbs if there's only one item or we're at root
  if (breadcrumbItems.length <= 1 && !showHome) {
    return null;
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mr-2 text-gray-600 hover:text-gray-900"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}

      <ol className="flex items-center space-x-2" role="list">
        {showHome && (
          <li>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Go to dashboard home"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
        )}

        {breadcrumbItems.map((item, index) => (
          <Fragment key={index}>
            {(showHome || index > 0) && (
              <li aria-hidden="true">
                {separator}
              </li>
            )}
            
            <li>
              {item.href && !item.current ? (
                <Link
                  href={item.href}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label={`Go to ${item.label}`}
                >
                  {item.icon && (
                    <span className="mr-1" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </Link>
              ) : (
                <span 
                  className="flex items-center text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.icon && (
                    <span className="mr-1" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

// Specialized breadcrumb for CamInv pages
interface CamInvBreadcrumbProps {
  currentPage?: string;
  invoiceNumber?: string;
  merchantName?: string;
  showBackButton?: boolean;
  className?: string;
}

export function CamInvBreadcrumb({
  currentPage,
  invoiceNumber,
  merchantName,
  showBackButton = true,
  className
}: CamInvBreadcrumbProps) {
  const pathname = usePathname();
  
  // Generate CamInv-specific breadcrumbs
  const generateCamInvBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'CamInv', href: '/caminv' }
    ];

    if (pathname.includes('/invoices')) {
      items.push({ label: 'Invoices', href: '/caminv/invoices' });
      
      if (invoiceNumber) {
        items.push({ 
          label: `Invoice #${invoiceNumber}`, 
          current: true 
        });
      } else if (pathname.includes('/create')) {
        items.push({ 
          label: 'Create Invoice', 
          current: true 
        });
      }
    } else if (pathname.includes('/merchants')) {
      items.push({ label: 'Merchants', href: '/caminv/merchants' });
      
      if (merchantName) {
        items.push({ 
          label: merchantName, 
          current: true 
        });
      }
    } else if (pathname.includes('/incoming-invoices')) {
      items.push({ 
        label: 'Incoming Invoices', 
        href: '/caminv/incoming-invoices' 
      });
    } else if (pathname.includes('/settings')) {
      items.push({ 
        label: 'Settings', 
        current: true 
      });
    }

    if (currentPage && !items.some(item => item.current)) {
      items.push({ 
        label: currentPage, 
        current: true 
      });
    }

    return items;
  };

  return (
    <EnhancedBreadcrumb
      items={generateCamInvBreadcrumbs()}
      showBackButton={showBackButton}
      className={className}
    />
  );
}

// Page header with breadcrumbs and actions
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  showBackButton?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  showBackButton = false,
  className
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 pb-6 border-b border-gray-200', className)}>
      <EnhancedBreadcrumb 
        items={breadcrumbs}
        showBackButton={showBackButton}
      />
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
