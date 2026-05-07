import ModuleGrid from "./ModuleGrid";
import { aiTools } from "@/data/modules";

export default function AISection() {
  return (
    <ModuleGrid
      id="ia"
      title="Inteligência Computacional"
      modules={aiTools}
    />
  );
}
