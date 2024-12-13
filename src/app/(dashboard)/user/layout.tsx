"use client";

import { ReactNode } from "react";
import { store } from "@/store/store";
import { Provider } from "react-redux";
import SidebarUser from "@/components/sidebar/SidebarUser";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <div className="flex h-screen">
        <SidebarUser />
        <main className="ml-64 flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </Provider>
  );
}
