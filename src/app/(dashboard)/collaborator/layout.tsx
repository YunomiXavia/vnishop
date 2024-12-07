"use client";

import { ReactNode } from "react";
import { store } from "@/store/store";
import { Provider } from "react-redux";
import SidebarCollaborator from "@/components/sidebar/SidebarCollaborator";

export default function CollaboratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Provider store={store}>
      <div className="flex h-screen">
        <SidebarCollaborator />
        <main className="flex-1 p-8 bg-gray-100">{children}</main>
      </div>
    </Provider>
  );
}
