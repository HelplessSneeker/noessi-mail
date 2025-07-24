'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

// Individual skeleton components
export function NavbarSkeleton() {
  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      {/* Mail heading */}
      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-6"></div>
      
      {/* Navigation items */}
      <div className="space-y-2 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {/* Compose button */}
      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
}

export function EmailListSkeleton() {
  return (
    <div className="w-80 flex-shrink-0 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Email list */}
      <div className="flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-gray-100 p-4 hover:bg-gray-50">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-3 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardContentSkeleton() {
  return (
    <div className="flex-1 bg-gray-50 p-3 sm:p-6">
      <div className="h-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid gap-4 sm:gap-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="flex items-baseline gap-2">
                      <div className="h-6 sm:h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      {i === 0 && <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* User Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="px-4 sm:px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main skeleton component that matches the dashboard layout
interface DashboardSkeletonProps {
  className?: string;
}

export function EmailViewerSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="h-4 w-12 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-12 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 w-36 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-12 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded ml-4"></div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-gray-200 rounded"></div>
          ))}
          <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        </div>
        
        {/* Attachments skeleton */}
        <div className="mt-8">
          <div className="h-5 w-24 bg-gray-200 rounded mb-4"></div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded mr-3"></div>
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <NavbarSkeleton />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <SidebarSkeleton />
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-80 flex-shrink-0 hidden md:block">
            <EmailListSkeleton />
          </div>
          
          {/* Mobile Email List - Shows when no email selected */}
          <div className="flex-1 md:hidden">
            <EmailListSkeleton />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardContentSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}