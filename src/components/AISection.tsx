import SectionGrid from "./SectionGrid";
import { aiTools } from "@/data/sections";

export default function AISection() {
  return (
    <SectionGrid
      id="ia"
      title="Inteligência Computacional"
      tools={aiTools}
    />
  );
}
