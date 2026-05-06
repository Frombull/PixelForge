import SectionGrid from "./SectionGrid";
import { multimediaTools } from "@/data/modules";

export default function MultimediaSection() {
  return (
    <SectionGrid
      id="multimidia"
      title="Multimídia"
      modules={multimediaTools}
    />
  );
}
