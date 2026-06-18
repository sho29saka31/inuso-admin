import { DbShell } from "./DbShell";

export default function DbLayout({ children }: { children: React.ReactNode }) {
  return <DbShell>{children}</DbShell>;
}
