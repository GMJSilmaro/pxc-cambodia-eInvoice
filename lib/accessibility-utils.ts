// Accessibility utilities for CamInv components

// ARIA label generators
export const ariaLabels = {
  invoiceStatus: (status: string, invoiceNumber: string) => 
    `Invoice ${invoiceNumber} status: ${status}`,
  
  invoiceAction: (action: string, invoiceNumber: string) => 
    `${action} invoice ${invoiceNumber}`,
  
  merchantStatus: (merchantName: string, status: string) => 
    `Merchant ${merchantName} connection status: ${status}`,
  
  refreshStatus: (invoiceNumber?: string) => 
    invoiceNumber 
      ? `Refresh status for invoice ${invoiceNumber}`
      : 'Refresh status',
  
  downloadDocument: (type: string, invoiceNumber: string) => 
    `Download ${type} for invoice ${invoiceNumber}`,
  
  verificationLink: (invoiceNumber: string) => 
    `View official verification for invoice ${invoiceNumber}`,
  
  formField: (fieldName: string, required: boolean = false) => 
    `${fieldName}${required ? ' (required)' : ''}`,
  
  sortColumn: (columnName: string, direction?: 'asc' | 'desc') => 
    direction 
      ? `Sort by ${columnName} ${direction === 'asc' ? 'ascending' : 'descending'}`
      : `Sort by ${columnName}`,
  
  pagination: (page: number, total: number) => 
    `Page ${page} of ${total}`,
  
  filterActive: (filterType: string, value: string) => 
    `Filter by ${filterType}: ${value} is active`,
  
  loadingState: (action: string) => 
    `${action} in progress, please wait`,
  
  errorState: (action: string) => 
    `Error occurred while ${action}. Please try again or contact support.`,
  
  successState: (action: string) => 
    `${action} completed successfully`
};

// ARIA descriptions for complex components
export const ariaDescriptions = {
  invoiceTable: 'Table containing invoice information with sortable columns and action buttons',
  
  statusBadge: (status: string) => 
    `Current processing status indicator showing ${status}`,
  
  progressIndicator: (step: number, total: number) => 
    `Progress indicator showing step ${step} of ${total}`,
  
  merchantCard: 'Card displaying merchant connection information and available actions',
  
  invoiceForm: 'Form for creating or editing invoice information with validation',
  
  filterPanel: 'Panel containing filters to narrow down invoice results',
  
  actionMenu: 'Menu containing available actions for this item',
  
  statusTimeline: 'Timeline showing the progression of invoice processing status',
  
  verificationPanel: 'Panel displaying CamInv verification information and links'
};

// Keyboard navigation helpers
export const keyboardHandlers = {
  // Handle Enter and Space key presses for custom buttons
  buttonKeyDown: (event: React.KeyboardEvent, onClick: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  },

  // Handle arrow key navigation in lists
  listNavigation: (
    event: React.KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    onIndexChange: (index: number) => void
  ) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        onIndexChange(currentIndex < itemCount - 1 ? currentIndex + 1 : 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        onIndexChange(currentIndex > 0 ? currentIndex - 1 : itemCount - 1);
        break;
      case 'Home':
        event.preventDefault();
        onIndexChange(0);
        break;
      case 'End':
        event.preventDefault();
        onIndexChange(itemCount - 1);
        break;
    }
  },

  // Handle table navigation
  tableNavigation: (
    event: React.KeyboardEvent,
    currentRow: number,
    currentCol: number,
    rowCount: number,
    colCount: number,
    onCellChange: (row: number, col: number) => void
  ) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentRow < rowCount - 1) {
          onCellChange(currentRow + 1, currentCol);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (currentRow > 0) {
          onCellChange(currentRow - 1, currentCol);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentCol < colCount - 1) {
          onCellChange(currentRow, currentCol + 1);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentCol > 0) {
          onCellChange(currentRow, currentCol - 1);
        }
        break;
    }
  },

  // Handle Escape key for closing modals/dropdowns
  escapeHandler: (event: React.KeyboardEvent, onClose: () => void) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }
};

// Focus management utilities
export const focusUtils = {
  // Trap focus within a container
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Restore focus to a previous element
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },

  // Get next focusable element
  getNextFocusable: (current: HTMLElement, container: HTMLElement) => {
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
    
    const currentIndex = focusableElements.indexOf(current);
    return focusableElements[currentIndex + 1] || focusableElements[0];
  },

  // Get previous focusable element
  getPreviousFocusable: (current: HTMLElement, container: HTMLElement) => {
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
    
    const currentIndex = focusableElements.indexOf(current);
    return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
  }
};

// Color contrast utilities
export const colorContrast = {
  // Check if color combination meets WCAG AA standards
  meetsWCAGAA: (foreground: string, background: string): boolean => {
    // This is a simplified check - in production, use a proper color contrast library
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                    (Math.min(fgLuminance, bgLuminance) + 0.05);
    return contrast >= 4.5; // WCAG AA standard
  },

  // Get suggested text color for background
  getTextColor: (backgroundColor: string): 'white' | 'black' => {
    const luminance = getLuminance(backgroundColor);
    return luminance > 0.5 ? 'black' : 'white';
  }
};

// Helper function to calculate luminance
function getLuminance(color: string): number {
  // Simplified luminance calculation
  // In production, use a proper color library
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Screen reader utilities
export const screenReader = {
  // Announce message to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Create visually hidden but screen reader accessible text
  createSROnlyText: (text: string): HTMLSpanElement => {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  }
};
