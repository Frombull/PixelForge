import ModuleGrid from "./ModuleGrid";
import { graphicsTools, multimediaTools, aiTools } from "@/data/modules";

export default function ModulesSection() {
  return (
    <>
      <ModuleGrid
        id="graphics"
        title="Computação Gráfica"
        modules={graphicsTools}
      />
      <ModuleGrid
        id="multimidia"
        title="Multimídia"
        modules={multimediaTools}
      />
      <ModuleGrid
        id="ia"
        title="Inteligência Computacional"
        modules={aiTools}
      />
    </>
  );
}
