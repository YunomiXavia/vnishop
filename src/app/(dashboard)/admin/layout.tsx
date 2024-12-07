"use client";

import { ReactNode } from "react";
import { store } from "@/store/store";
import { Provider } from "react-redux";
import SidebarAdmin from "@/components/sidebar/SidebarAdmin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
      <Provider store={store}>
        <div className="flex h-screen">
          <SidebarAdmin />
          <main className="flex-1 p-8 bg-gray-100">
            {children}
          </main>
        </div>
      </Provider>
  );
}
