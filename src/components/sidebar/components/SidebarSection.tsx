import { ReactNode } from "react";

const SidebarSection = ({ children }: { children: ReactNode }) => (
  <nav className="space-y-3 mt-4">{children}</nav>
);

export default SidebarSection;
