"use client";

import * as React from "react";
import Link from 'next/link';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { ConsistentCard } from '@/components/ui/consistent-styling';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  FileText,
  MoreHorizontal,
  Eye,
  Download,
  Send,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Search,
  User,
  Calendar,
  DollarSign,
  Hash,
  Building2,
  Receipt,
  AlertCircle,
  Info,
  Settings,
  Filter,
  ArrowRight
} from 'lucide-react';

// Enhanced Invoice interface with all CamInv fields
export interface StandardizedInvoice {
  id: number;
  invoiceNumber: string;
  invoiceType: string;
  status: string;
  direction: 'outgoing' | 'incoming';
  customerName: string;
  totalAmount: string;
  currency: string;
  issueDate: string;
  dueDate?: string;
  submittedAt?: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  camInvStatus?: string;
  verificationLink?: string;
  documentId?: string;
  customerId?: string;
  customerCompanyNameKh?: string;
  customerCompanyNameEn?: string;
  supplierId?: string;
  supplierCompanyNameKh?: string;
  supplierCompanyNameEn?: string;
  createdBy?: string;
  createdAt?: string;
  merchantId?: string;
}

interface StandardizedInvoiceTableProps {
  data: StandardizedInvoice[];
  variant?: 'full' | 'compact' | 'recent';
  title?: string;
  description?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  className?: string;
  onRowClick?: (invoice: StandardizedInvoice) => void;
}

// Status badge component with semantic colors
function getStatusBadge(status: string, camInvStatus?: string) {
  const normalizedStatus = status.toLowerCase();
  const normalizedCamInvStatus = camInvStatus?.toLowerCase();

  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case 'draft':
        return {
          variant: 'secondary' as const,
          label: 'Draft',
          icon: Info,
          className: 'bg-gray-50 text-gray-700 border-gray-200'
        };
      case 'submitted':
        if (normalizedCamInvStatus === 'validated' || normalizedCamInvStatus === 'valid') {
          return {
            variant: 'default' as const,
            label: 'Validated',
            icon: CheckCircle2,
            className: 'bg-green-50 text-green-700 border-green-200'
          };
        } else if (normalizedCamInvStatus === 'validation_failed' || normalizedCamInvStatus === 'invalid') {
          return {
            variant: 'destructive' as const,
            label: 'Failed',
            icon: XCircle,
            className: 'bg-red-50 text-red-700 border-red-200'
          };
        } else {
          return {
            variant: 'outline' as const,
            label: 'Processing',
            icon: Clock,
            className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
          };
        }
      case 'validated':
        return {
          variant: 'default' as const,
          label: 'Validated',
          icon: CheckCircle2,
          className: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'sent':
        return {
          variant: 'default' as const,
          label: 'Sent',
          icon: Send,
          className: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'accepted':
        return {
          variant: 'default' as const,
          label: 'Accepted',
          icon: CheckCircle2,
          className: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          label: 'Rejected',
          icon: XCircle,
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'cancelled':
        return {
          variant: 'outline' as const,
          label: 'Cancelled',
          icon: XCircle,
          className: 'bg-gray-50 text-gray-600 border-gray-200'
        };
      default:
        return {
          variant: 'outline' as const,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          icon: Clock,
          className: 'bg-gray-50 text-gray-600 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1.5 ${config.className} transition-colors duration-200`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// Direction badge component
function getDirectionBadge(direction: 'outgoing' | 'incoming') {
  return direction === 'outgoing' ? (
    <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
      <Send className="w-3 h-3" />
      Outgoing
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
      <Download className="w-3 h-3" />
      Incoming
    </Badge>
  );
}

// Invoice type badge component
function getInvoiceTypeBadge(type: string) {
  switch (type) {
    case 'invoice':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Invoice</Badge>;
    case 'credit_note':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Credit Note</Badge>;
    case 'debit_note':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Debit Note</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">Invoice</Badge>;
  }
}

// Customer initials helper
function getCustomerInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Actions dropdown component
function InvoiceActions({ invoice }: { invoice: StandardizedInvoice }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/caminv/invoices/${invoice.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </DropdownMenuItem>
        {invoice.verificationLink && (
          <DropdownMenuItem asChild>
            <a href={invoice.verificationLink} target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              CamInv Verification
            </a>
          </DropdownMenuItem>
        )}
        {invoice.status === 'draft' && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/caminv/invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="mr-2 h-4 w-4" />
              Submit to CamInv
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Column definitions for different table variants
function getColumns(variant: 'full' | 'compact' | 'recent'): ColumnDef<StandardizedInvoice>[] {
  const baseColumns: ColumnDef<StandardizedInvoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => {
        const handleSort = () => {
          column.toggleSorting(column.getIsSorted() === "asc");
        };
        
        return (
          <Button
            variant="ghost"
            onClick={handleSort}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            {variant === 'recent' ? (
              <div className="flex items-center gap-1">
                <Receipt className="h-3 w-3 text-gray-500" />
                <span>Document No.</span>
              </div>
            ) : (
              'Invoice #'
            )}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/caminv/invoices/${invoice.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm font-medium"
            >
              {invoice.invoiceNumber}
            </Link>
            {variant === 'recent' && invoice.documentId && (
              <span className="text-xs text-gray-500 truncate">
                Doc: {invoice.documentId.substring(0, 8)}...
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-2 min-w-0">
            {variant === 'recent' && (
              <Avatar className="h-6 w-6 bg-gray-100 border border-gray-200 flex-shrink-0">
                <AvatarFallback className="text-xs text-gray-700">
                  {getCustomerInitials(invoice.customerName)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className={`font-medium text-gray-900 truncate ${variant === 'recent' ? 'text-xs' : 'text-sm'}`}>
                {invoice.customerName}
              </span>
              {invoice.customerCompanyNameKh && (
                <span className={`text-gray-500 truncate ${variant === 'recent' ? 'text-[10px]' : 'text-xs'}`}>
                  {invoice.customerCompanyNameKh}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  // Add variant-specific columns
  if (variant === 'full') {
    baseColumns.push(
      {
        accessorKey: "invoiceType",
        header: "Type",
        cell: ({ row }) => getInvoiceTypeBadge(row.original.invoiceType),
      },
      {
        accessorKey: "direction",
        header: "Direction",
        cell: ({ row }) => getDirectionBadge(row.original.direction),
      },
      {
        accessorKey: "createdBy",
        header: "Source",
        cell: ({ row }) => (
          <Badge
            variant={row.original.createdBy === 'API_INTEGRATION' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {row.original.createdBy === 'API_INTEGRATION' ? 'API' : 'Manual'}
          </Badge>
        ),
      }
    );
  }

  if (variant === 'recent') {
    baseColumns.push(
      {
        accessorKey: "invoiceType",
        header: "Type",
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              {getInvoiceTypeBadge(invoice.invoiceType || 'invoice')}
              {invoice.dueDate && (
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                  <Calendar className="h-2 w-2" />
                  Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "createdBy",
        header: "Source",
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <Badge
                variant={invoice.createdBy === 'API_INTEGRATION' ? 'default' : 'secondary'}
                className="text-[10px] w-fit"
              >
                {invoice.createdBy === 'API_INTEGRATION' ? 'API' : 'CamInv'}
              </Badge>
              {invoice.verificationLink && (
                <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                  <CheckCircle2 className="h-2 w-2" />
                  Verified
                </span>
              )}
            </div>
          );
        },
      }
    );
  }

  // Common columns for all variants
  baseColumns.push(
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            {getStatusBadge(invoice.status, invoice.camInvStatus)}
            {variant === 'recent' && invoice.camInvStatus && (
              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                {invoice.camInvStatus === 'accepted' ? (
                  <CheckCircle2 className="h-2 w-2 text-green-500" />
                ) : invoice.camInvStatus === 'rejected' ? (
                  <AlertCircle className="h-2 w-2 text-red-500" />
                ) : (
                  <Clock className="h-2 w-2 text-yellow-500" />
                )}
                CamInv: {invoice.camInvStatus}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent ml-auto"
        >
          {variant === 'recent' ? (
            <div className="flex items-center justify-end gap-1">
              <DollarSign className="h-3 w-3 text-gray-500" />
              <span>Amount</span>
            </div>
          ) : (
            'Amount'
          )}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        const amount = parseFloat(invoice.totalAmount);
        return (
          <div className={`text-right ${variant === 'recent' ? 'flex flex-col items-end gap-0.5' : ''}`}>
            <span className={`font-medium text-gray-900 ${variant === 'recent' ? 'text-xs' : 'text-sm'}`}>
              {amount.toLocaleString()} {invoice.currency}
            </span>
            {variant === 'recent' && (
              <span className="text-[10px] text-gray-500">
                Tax: {(amount * 0.1).toLocaleString()} {invoice.currency}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          {variant === 'recent' ? (
            <div className="flex items-center justify-end gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span>Date</span>
            </div>
          ) : (
            'Issue Date'
          )}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className={`${variant === 'recent' ? 'text-right flex flex-col items-end gap-0.5' : ''}`}>
            <span className={`text-gray-900 ${variant === 'recent' ? 'text-xs' : 'text-sm'}`}>
              {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                month: variant === 'recent' ? 'short' : 'long',
                day: 'numeric',
                year: variant === 'recent' ? undefined : 'numeric'
              })}
            </span>
            {variant === 'recent' && (
              <span className="text-[10px] text-gray-500">
                {invoice.submittedAt ? (
                  <>Submitted {new Date(invoice.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}</>
                ) : (
                  new Date(invoice.issueDate).getFullYear()
                )}
              </span>
            )}
          </div>
        );
      },
    }
  );

  // Actions column
  if (variant === 'recent') {
    baseColumns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0 hover:bg-blue-50">
                  <Link href={`/caminv/invoices/${invoice.id}`}>
                    <Eye className="h-3 w-3 text-blue-600" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View invoice details</TooltipContent>
            </Tooltip>
            {invoice.status === 'submitted' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0 hover:bg-green-50">
                    <Link href={`/caminv/invoices/${invoice.id}/send`}>
                      <Send className="h-3 w-3 text-green-600" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send to customer</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    });
  } else {
    baseColumns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => <InvoiceActions invoice={row.original} />,
    });
  }

  return baseColumns;
}

// Main standardized invoice table component
export function StandardizedInvoiceTable({
  data,
  variant = 'full',
  title,
  description,
  showSearch = true,
  showFilters = false,
  showPagination = true,
  pageSize = 25,
  className,
  onRowClick
}: StandardizedInvoiceTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo(() => getColumns(variant), [variant]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Empty state
  if (data.length === 0) {
    return (
      <ConsistentCard className={className}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Invoices Found</h3>
          <p className="text-gray-600 mb-6">
            You haven't created any e-invoices yet. Start by creating your first invoice.
          </p>
          <Button asChild>
            <Link href="/caminv/invoices/create">
              <FileText className="h-4 w-4 mr-2" />
              Create First Invoice
            </Link>
          </Button>
        </div>
      </ConsistentCard>
    );
  }

  // Extract the content to be wrapped
  const tableContent = (
    <ConsistentCard className={className}>
      {(title || description || showSearch || showFilters) && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h2 className={`flex items-center gap-3 ${variant === 'recent' ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
                  <div className={`${variant === 'recent' ? 'p-1.5' : 'p-2'} bg-blue-100 rounded-lg`}>
                    <FileText className={`${variant === 'recent' ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
                  </div>
                  {title}
                </h2>
              )}
              {description && (
                <p className={`${variant === 'recent' ? 'text-sm mt-1' : 'text-base mt-2'} text-gray-600`}>
                  {description}
                </p>
              )}
            </div>
            {(showSearch || showFilters) && (
              <div className="flex items-center gap-3">
                {showSearch && (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      placeholder="Search invoices..."
                      value={globalFilter ?? ""}
                      onChange={(event) => setGlobalFilter(String(event.target.value))}
                      className="pl-10 w-[300px]"
                    />
                  </div>
                )}
                {showFilters && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                          return (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                              {column.id}
                            </DropdownMenuCheckboxItem>
                          );
                        })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={`${variant === 'recent' ? 'rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden' : 'rounded-lg border border-gray-200 bg-white shadow-sm'}`}>
        <Table>
          <TableHeader className={variant === 'recent' ? 'bg-gray-50/50' : ''}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {variant === 'recent' && (
                  <TableHead className="w-[40px] font-medium text-xs text-gray-700">#</TableHead>
                )}
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={variant === 'recent' ? 'font-medium text-xs text-gray-700' : ''}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {variant === 'recent' && (
                    <TableCell className="text-xs text-gray-500 font-medium w-[40px]">{index + 1}</TableCell>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={variant === 'recent' ? 'text-xs' : ''}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && table.getPageCount() > 1 && (
        <div className="flex justify-end mt-4">
          {/* Assuming Pagination component is available or will be added */}
          {/* <Pagination
            pageIndex={table.getState().pagination.pageIndex}
            pageCount={table.getPageCount()}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPreviousPage={table.previousPage}
            onNextPage={table.nextPage}
          /> */}
        </div>
      )}
    </ConsistentCard>
  );

  // Conditionally wrap in TooltipProvider if variant is 'recent'
  return variant === 'recent' ? (
    <TooltipProvider>
      {tableContent}
    </TooltipProvider>
  ) : (
    tableContent
  );
}
