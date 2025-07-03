import React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center px-4 py-2 rounded-md border bg-black text-white hover:bg-neutral-800 ${className}`}
      {...props}
    />
  )
)

Button.displayName = "Button"
