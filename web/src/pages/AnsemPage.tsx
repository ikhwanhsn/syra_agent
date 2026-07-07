import { useEffect } from "react";
import { AnsemView } from "@/components/ansem/AnsemView";
import { ANSEM } from "@/lib/ansem";

export default function AnsemPage() {
  useEffect(() => {
    document.title = `$${ANSEM.symbol} · Token Hub · Syra`;
    return () => {
      document.title = "Syra";
    };
  }, []);

  return <AnsemView />;
}
