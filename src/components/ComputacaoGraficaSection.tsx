import SectionGrid from "./SectionGrid";
import { graphicsTools } from "@/data/modules";

export default function ComputacaoGraficaSection() {
  return (
    <SectionGrid
      id="graphics"
      title="Computação Gráfica"
      modules={graphicsTools}
    />
  );
}
