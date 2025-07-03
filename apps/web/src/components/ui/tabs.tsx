import React, { useState } from "react";

type TabsProps = {
  defaultValue: string;
  children: React.ReactNode;
};

export function Tabs({ defaultValue, children }: TabsProps) {
  const [currentValue, setCurrentValue] = useState(defaultValue);

  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    // Inject currentValue and setCurrentValue to children (TabsList, TabsTrigger, TabsContent)
    return React.cloneElement(child, {
      currentValue,
      setCurrentValue,
    });
  });
}

type TabsListProps = {
  children: React.ReactNode;
  currentValue?: string; // will receive from Tabs via cloneElement
  setCurrentValue?: (value: string) => void;
};

export function TabsList({ children }: TabsListProps) {
  return <div className="flex gap-2 border-b pb-2">{children}</div>;
}

type TabsTriggerProps = {
  children: React.ReactNode;
  value: string;
  currentValue?: string;
  setCurrentValue?: (value: string) => void;
};

export function TabsTrigger({ children, value, currentValue, setCurrentValue }: TabsTriggerProps) {
  const isActive = currentValue === value;

  return (
    <button
      onClick={() => setCurrentValue?.(value)}
      className={`px-4 py-2 border-b-2 ${isActive ? "border-black" : "border-transparent"} hover:text-black`}
      type="button"
    >
      {children}
    </button>
  );
}

type TabsContentProps = {
  children: React.ReactNode;
  value: string;
  currentValue?: string;
};

export function TabsContent({ children, value, currentValue }: TabsContentProps) {
  if (value !== currentValue) return null;
  return <div className="pt-4">{children}</div>;
}
