"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiResourcePage, type ResourceConfig } from "@/components/shared/api-resource-page";

export type TabEntry = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  config: ResourceConfig;
};

export function TabbedResourcePage({ tabs, defaultTab }: { tabs: TabEntry[]; defaultTab?: string }) {
  const first = tabs[0]?.label ?? "";
  return (
    <Tabs defaultValue={defaultTab ?? first} className="w-full">
      <div className="border-b bg-background px-4 lg:px-8">
        <TabsList className="h-12 gap-1 rounded-none bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.label}
              value={tab.label}
              className="relative h-full rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {tab.icon ? <tab.icon className="mr-2 h-4 w-4" /> : null}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.label} value={tab.label} className="mt-0">
          <ApiResourcePage config={tab.config} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
