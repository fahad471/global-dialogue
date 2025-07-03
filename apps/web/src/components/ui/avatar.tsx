import React from "react"

export function Avatar({ children, className = "" }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`relative w-10 h-10 rounded-full overflow-hidden ${className}`}>{children}</div>
}

export function AvatarImage({ src, alt = "", className = "" }: { src: string; alt?: string; className?: string }) {
  return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} />
}

export function AvatarFallback({ children, className = "" }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-center w-full h-full bg-gray-200 text-sm ${className}`}>
      {children}
    </div>
  )
}
