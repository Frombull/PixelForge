import ModuleGrid from "./ModuleGrid";
import { graphicsTools } from "@/data/modules";

export default function ComputacaoGraficaSection() {
  return (
    <ModuleGrid
      id="graphics"
      title="Computação Gráfica"
      modules={graphicsTools}
    />
  );
}
