import ModuleGrid from "./ModuleGrid";
import { multimediaTools } from "@/data/modules";

export default function MultimediaSection() {
  return (
    <ModuleGrid
      id="multimidia"
      title="Multimídia"
      modules={multimediaTools}
    />
  );
}
