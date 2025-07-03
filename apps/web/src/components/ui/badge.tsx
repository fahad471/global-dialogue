import React from "react"

export function Badge({ children, className = "" }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 rounded ${className}`}>
      {children}
    </span>
  )
}
