import { BottomNav } from "./BottomNav";

// Every paired-app route shares the fixed bottom tab bar. This is a route
// group (parentheses folder) so it doesn't add a URL segment — "/" and
// "/timeline" etc. stay exactly as-is.
export default function PairedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
