import SectionGrid from "./SectionGrid";
import { graphicsTools } from "@/data/sections";

export default function SectionsGrid() {
  return (
    <SectionGrid
      id="graphics"
      title="Computação Gráfica"
      tools={graphicsTools}
    />
  );
}
