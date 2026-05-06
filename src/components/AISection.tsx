import SectionGrid from "./SectionGrid";
import { aiTools } from "@/data/modules";

export default function AISection() {
  return (
    <SectionGrid
      id="ia"
      title="Inteligência Computacional"
      modules={aiTools}
    />
  );
}
