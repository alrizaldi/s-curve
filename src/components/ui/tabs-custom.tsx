import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";
import React from "react";

interface Tab {
  title: string;
  value: string;
}

const tabs: Tab[] = [
  {
    title: "Inbox",
    value: "tab1",
  },
  {
    title: "Today",
    value: "tab2",
  },
  {
    title: "Upcoming",
    value: "tab3",
  },
];

interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultValue, onValueChange, children }) => {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className="flex flex-col space-y-4"
    >
      <TabsPrimitive.List className="flex flex-wrap border-b border-slate-200">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={clsx(
              "py-2 px-4 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50",
              "data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-t-md",
              "transition-colors duration-200"
            )}
          >
            {tab.title}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children }) => {
  return (
    <TabsPrimitive.Content value={value} className="py-4">
      {children}
    </TabsPrimitive.Content>
  );
};

export { Tabs, TabsContent, type Tab };