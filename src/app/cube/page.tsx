import type { Metadata } from "next";
import CubeWorkspace from "../../components/cube/CubeWorkspace";

export const metadata: Metadata = {
  title: "Espaço de Cor RGB | PixelForge",
  description: "Visualização interativa do espaço de cor RGB em um cubo tridimensional.",
};

export default function CubePage() {
  return <CubeWorkspace />;
}
