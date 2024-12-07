"use client";

import { ReactNode } from "react";
import { store } from "@/store/store";
import { Provider } from "react-redux";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
