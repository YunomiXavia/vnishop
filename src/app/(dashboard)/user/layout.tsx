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
        <main className="flex-1 p-8 bg-gray-100">{children}</main>
      </div>
    </Provider>
  );
}
