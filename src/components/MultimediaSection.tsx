import SectionGrid from "./SectionGrid";
import { multimediaTools } from "@/data/sections";

export default function Multimedia() {
  return (
    <SectionGrid
      id="multimidia"
      title="Multimídia"
      tools={multimediaTools}
    />
  );
}
