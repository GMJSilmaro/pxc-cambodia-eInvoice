/**
 * Version and update data for the What's New popup system
 */

export interface UpdateItem {
  id: string;
  type: 'feature' | 'improvement' | 'bugfix';
  title: string;
  description: string;
  icon?: string;
}

export interface VersionUpdate {
  version: string;
  releaseDate: string;
  title: string;
  description: string;
  updates: UpdateItem[];
  isHighlight?: boolean;
}

export const versionHistory: VersionUpdate[] = [
  {
    version: "2.5.0",
    releaseDate: "2025-01-15",
    title: "Professional Invoice Detail Page Redesign",
    description: "Complete redesign of the invoice detail page with professional navy blue color scheme, improved layout, enhanced CamInv integration display, and better user experience.",
    isHighlight: true,
    updates: [
      {
        id: "professional-invoice-detail-redesign",
        type: "improvement",
        title: "Professional Invoice Detail Page Redesign",
        description: "Complete redesign with clean layout, professional navy blue color scheme, improved information hierarchy, and enhanced CamInv integration display for better user experience.",
        icon: "🎨"
      },
      {
        id: "enhanced-caminv-data-display",
        type: "feature",
        title: "Enhanced CamInv Data Display",
        description: "Added comprehensive display of CamInv enhanced fields including Customer ID, Company Names (KH/EN), Document ID, and creation source with proper visual hierarchy.",
        icon: "📋"
      },
      {
        id: "improved-visual-hierarchy",
        type: "improvement",
        title: "Improved Visual Hierarchy",
        description: "Restructured page layout with clear sections, consistent spacing, professional typography, and semantic color coding for better information scanning and understanding.",
        icon: "📐"
      },
      {
        id: "consistent-design-system",
        type: "improvement",
        title: "Consistent Design System",
        description: "Applied consistent navy blue design system throughout the page, removed colorful gradients, and maintained professional B2B appearance with subtle design elements.",
        icon: "🎯"
      },
      {
        id: "enhanced-status-badges",
        type: "improvement",
        title: "Enhanced Status Badges with Icons",
        description: "Added semantic icons to status badges (CheckCircle for success, AlertCircle for errors, Clock for pending) for better visual recognition and accessibility.",
        icon: "🏷️"
      },
      {
        id: "optimized-responsive-layout",
        type: "improvement",
        title: "Optimized Responsive Layout",
        description: "Improved responsive design with better grid layouts, proper spacing on all screen sizes, and enhanced mobile experience while maintaining desktop functionality.",
        icon: "📱"
      }
    ]
  },
  {
    version: "2.4.0",
    releaseDate: "2025-01-15",
    title: "Advanced Invoice Analytics & Enhanced Table Management",
    description: "Comprehensive invoice analytics dashboard with multiple chart types, fixed missing table columns, and enhanced data visualization for better business insights.",
    isHighlight: false,
    updates: [
      {
        id: "comprehensive-analytics-dashboard",
        type: "feature",
        title: "Comprehensive Invoice Analytics Dashboard",
        description: "Added multiple chart types including pie charts for status distribution, bar charts for status counts, area charts for trends, and donut charts for CamInv vs internal status comparison using ShadCN Charts library.",
        icon: "📊"
      },
      {
        id: "real-time-analytics-data",
        type: "feature",
        title: "Real-Time Analytics Data Service",
        description: "Implemented analytics service with real database queries for accurate invoice status distribution, success rates, pending counts, and trend analysis over the last 30 days.",
        icon: "⚡"
      },
      {
        id: "fixed-missing-table-columns",
        type: "improvement",
        title: "Fixed Missing CamInv Invoice Table Columns",
        description: "Added missing enhanced columns (Customer ID, Type, Source, Document ID) to the main CamInv invoices page table to match the recently implemented database schema.",
        icon: "🔧"
      },
      {
        id: "semantic-color-coding",
        type: "improvement",
        title: "Semantic Color Coding for Analytics",
        description: "Applied professional color scheme with semantic colors: green for success states, red for errors, yellow for pending, and gray for neutral states across all charts and analytics.",
        icon: "🎨"
      },
      {
        id: "enhanced-summary-statistics",
        type: "improvement",
        title: "Enhanced Summary Statistics",
        description: "Added comprehensive summary cards showing total invoices, success rate, pending count, and CamInv managed invoices with gradient backgrounds and professional icons.",
        icon: "📈"
      },
      {
        id: "table-consistency-verification",
        type: "improvement",
        title: "Table Consistency Across Components",
        description: "Ensured both main invoices page and dashboard RecentInvoicesTable component show the same enhanced column structure with proper responsive design and data mapping.",
        icon: "✅"
      }
    ]
  },
  {
    version: "2.3.0",
    releaseDate: "2025-01-15",
    title: "Comprehensive CamInv Invoice System Enhancement",
    description: "Major overhaul of the CamInv invoice system with enhanced database schema, improved table displays, document management API integration, and optimized layouts.",
    isHighlight: false,
    updates: [
      {
        id: "enhanced-database-schema",
        type: "feature",
        title: "Enhanced Database Schema for CamInv API Fields",
        description: "Added comprehensive CamInv API fields including customer_id, supplier_id, company names in Khmer/English, document_id, created_by, and validated_at for complete data synchronization.",
        icon: "🗄️"
      },
      {
        id: "improved-table-data-source",
        type: "improvement",
        title: "Improved Invoice Table Data Source",
        description: "Optimized invoice tables to use local database instead of live API calls for better performance, with enhanced field mapping from CamInv List Documents API.",
        icon: "⚡"
      },
      {
        id: "enhanced-table-displays",
        type: "improvement",
        title: "Enhanced Invoice Table Displays",
        description: "Added valuable CamInv API data columns including Customer ID, Khmer company names, Document ID, creation source (API/Manual), and verification status.",
        icon: "📊"
      },
      {
        id: "document-management-apis",
        type: "feature",
        title: "Document Management API Integration",
        description: "Implemented comprehensive CamInv document management APIs: Send Document, Accept Document, Reject Document, and Update Document Status with proper workflow preservation.",
        icon: "🔄"
      },
      {
        id: "optimized-layouts",
        type: "improvement",
        title: "Optimized Layout & Preview Sections",
        description: "Fixed layout issues, reduced excessive empty space in preview sections, improved responsive design, and enhanced space utilization throughout the application.",
        icon: "🎨"
      },
      {
        id: "enhanced-customer-display",
        type: "improvement",
        title: "Enhanced Customer Information Display",
        description: "Improved customer information display with Khmer company names, better avatar initials, and comprehensive customer details in table views.",
        icon: "👥"
      }
    ]
  },
  {
    version: "2.2.0",
    releaseDate: "2025-01-15",
    title: "Hybrid Notifications & Enhanced Invoice Management",
    description: "Revolutionary notification system with step-by-step progress tracking and comprehensive invoice table enhancements.",
    isHighlight: false,
    updates: [
      {
        id: "hybrid-notifications",
        type: "feature",
        title: "Hybrid Notification System",
        description: "Premium modal loading with live progress indicators and step-by-step process descriptions, combined with success toast notifications for optimal user experience.",
        icon: "🔔"
      },
      {
        id: "enhanced-progress-steps",
        type: "feature",
        title: "Enhanced Progress Steps",
        description: "Detailed progress tracking for document submission with specific percentage completion and micro-interactions for premium UX.",
        icon: "📊"
      },
      {
        id: "invoice-table-enhancement",
        type: "improvement",
        title: "Enhanced Invoice Table",
        description: "Fixed layout issues, added new data columns from CamInv API including document type, creation source, and submission timestamps.",
        icon: "📋"
      },
      {
        id: "database-schema-update",
        type: "improvement",
        title: "Database Schema Enhancement",
        description: "Added new fields to store CamInv API response data including supplier/customer IDs, Khmer company names, and sync timestamps for better performance.",
        icon: "🗄️"
      },
      {
        id: "responsive-table-layout",
        type: "improvement",
        title: "Responsive Table Layout",
        description: "Fixed excessive white space issues and improved column sizing for better data visibility and user experience.",
        icon: "📱"
      },
      {
        id: "premium-loading-animations",
        type: "improvement",
        title: "Premium Loading Animations",
        description: "Added sophisticated loading animations and micro-interactions throughout the application for enhanced professional appearance.",
        icon: "✨"
      }
    ]
  },
  {
    version: "2.1.0",
    releaseDate: "2025-07-15",
    title: "Enhanced CamInv Integration & Professional UI",
    description: "Major improvements to the CamInv e-invoicing system with a completely redesigned professional interface.",
    isHighlight: false,
    updates: [
      {
        id: "caminv-ubl-enhancement",
        type: "feature",
        title: "Enhanced UBL XML Generation",
        description: "Improved UBL XML generation for different document types with proper billing references for credit and debit notes.",
        icon: "📄"
      },
      {
        id: "tax-dropdowns",
        type: "feature", 
        title: "Tax Category & Scheme Dropdowns",
        description: "Added comprehensive tax category and tax scheme selection based on official CamInv documentation.",
        icon: "💰"
      },
      {
        id: "invoice-selection",
        type: "feature",
        title: "Original Invoice Selection",
        description: "New functionality to select existing invoices when creating credit notes and debit notes for proper billing references.",
        icon: "🔗"
      },
      {
        id: "professional-ui",
        type: "improvement",
        title: "Professional UI Design",
        description: "Completely redesigned interface with professional navy blue color scheme and enhanced navigation.",
        icon: "🎨"
      },
      {
        id: "sidebar-enhancement",
        type: "improvement",
        title: "Enhanced Navigation Sidebar",
        description: "Improved sidebar with better icons, collapsible sub-navigation, and professional styling.",
        icon: "📱"
      }
    ]
  },
  {
    version: "2.0.5",
    releaseDate: "2025-07-01",
    title: "CamInv API Improvements",
    description: "Enhanced CamInv API integration with better error handling and status tracking.",
    updates: [
      {
        id: "api-reliability",
        type: "improvement",
        title: "Improved API Reliability",
        description: "Enhanced error handling and retry mechanisms for CamInv API calls.",
        icon: "🔧"
      },
      {
        id: "status-tracking",
        type: "feature",
        title: "Real-time Status Tracking",
        description: "Added real-time status updates for invoice submissions and validations.",
        icon: "📊"
      },
      {
        id: "webhook-fixes",
        type: "bugfix",
        title: "Webhook Processing Fixes",
        description: "Fixed issues with webhook event processing and status updates.",
        icon: "🐛"
      }
    ]
  },
  {
    version: "2.0.0",
    releaseDate: "2025-06-15",
    title: "CamInv E-Invoicing Launch",
    description: "Official launch of the CamInv e-invoicing integration for Cambodia tax compliance.",
    updates: [
      {
        id: "caminv-integration",
        type: "feature",
        title: "CamInv Integration",
        description: "Full integration with Cambodia's official e-invoicing system.",
        icon: "🇰🇭"
      },
      {
        id: "oauth-flow",
        type: "feature",
        title: "OAuth 2.0 Authentication",
        description: "Secure OAuth 2.0 flow for merchant authentication with CamInv.",
        icon: "🔐"
      },
      {
        id: "invoice-management",
        type: "feature",
        title: "Invoice Management Dashboard",
        description: "Comprehensive dashboard for managing outgoing and incoming invoices.",
        icon: "📋"
      }
    ]
  }
];

export const getCurrentVersion = (): string => {
  return versionHistory[0]?.version || "2.1.0";
};

export const getLatestUpdate = (): VersionUpdate | null => {
  return versionHistory[0] || null;
};

export const getUpdatesSince = (lastSeenVersion: string): VersionUpdate[] => {
  const lastSeenIndex = versionHistory.findIndex(v => v.version === lastSeenVersion);
  if (lastSeenIndex === -1) {
    // If version not found, return all updates
    return versionHistory;
  }
  return versionHistory.slice(0, lastSeenIndex);
};

export const getTypeIcon = (type: UpdateItem['type']): string => {
  switch (type) {
    case 'feature':
      return '✨';
    case 'improvement':
      return '🚀';
    case 'bugfix':
      return '🐛';
    default:
      return '📝';
  }
};

export const getTypeLabel = (type: UpdateItem['type']): string => {
  switch (type) {
    case 'feature':
      return 'New Feature';
    case 'improvement':
      return 'Improvement';
    case 'bugfix':
      return 'Bug Fix';
    default:
      return 'Update';
  }
};

export const getTypeColor = (type: UpdateItem['type']): string => {
  switch (type) {
    case 'feature':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'improvement':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'bugfix':
      return 'bg-green-200 text-green-900 border-green-400';
    default:
      return 'bg-green-50 text-green-600 border-green-200';
  }
};

// Current version for the application
export const CURRENT_VERSION = "2.2.0";
