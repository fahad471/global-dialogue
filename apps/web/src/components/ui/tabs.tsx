import React, { useState } from "react"

export function Tabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
  const [value, setValue] = useState(defaultValue)
  return React.Children.map(children, (child) =>
    React.isValidElement(child) ? React.cloneElement(child, { value, setValue }) : child
  )
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 border-b pb-2">{children}</div>
}

export function TabsTrigger({
  children,
  value,
  setValue,
  currentValue,
}: {
  children: React.ReactNode
  value: string
  setValue?: (v: string) => void
  currentValue?: string
}) {
  const isActive = currentValue === value
  return (
    <button
      onClick={() => setValue?.(value)}
      className={`px-4 py-2 border-b-2 ${isActive ? "border-black" : "border-transparent"} hover:text-black`}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  children,
  value,
  currentValue,
}: {
  children: React.ReactNode
  value: string
  currentValue?: string
}) {
  if (value !== currentValue) return null
  return <div className="pt-4">{children}</div>
}
