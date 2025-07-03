import React from "react"

export function Card({ children, className = "" }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border bg-white shadow p-4 ${className}`}>{children}</div>
}

export function CardContent({ children, className = "" }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-2 ${className}`}>{children}</div>
}
