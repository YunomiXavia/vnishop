"use client";

import { ReactNode } from "react";
import { store } from "@/store/store";
import { Provider } from "react-redux";
import SidebarAdmin from "@/components/sidebar/SidebarAdmin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <div className="flex">
        <SidebarAdmin />
        <main className="ml-64 flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </Provider>
  );
}
