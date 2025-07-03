import React from "react"

export function Progress({ value = 0, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`w-full h-3 bg-gray-200 rounded-full ${className}`}>
      <div
        className="h-full bg-blue-600 rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
