import type { ReactNode } from "react";

/* remounts on each navigation: the arriving screen fades in over the
   skeleton that held its place */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
