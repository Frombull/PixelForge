"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ImageInfo {
  width: number;
  height: number;
  data: ImageData | null;
}

const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
    input[type=range]::-webkit-slider-thumb { cursor: grab; }
    input[type=range]::-moz-range-thumb { cursor: grab; border-radius: 0; }
  `}</style>
);

export default function SegmentationPage() {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const segmentationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(15);
  const [opacity, setOpacity] = useState(0.7);
  const [tolerance, setTolerance] = useState(30);
  const [mode, setMode] = useState<"smart" | "paint">("smart");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [imageInfo, setImageInfo] = useState<ImageInfo>({
    width: 0,
    height: 0,
    data: null,
  });

  useEffect(() => {
    loadDefaultImage();
  }, []);

  const loadDefaultImage = async () => {
    try {
      const response = await fetch("/images/ArchLinux_logo.jpg");
      const blob = await response.blob();
      const file = new File([blob], "ArchLinux_logo.jpg", {
        type: "image/jpeg",
      });
      handleFile(file);
    } catch (error) {
      console.error("Erro ao carregar imagem padrão:", error);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setupCanvas(img);
        setImageLoaded(true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const setupCanvas = (img: HTMLImageElement) => {
    const imageCanvas = imageCanvasRef.current;
    const segmentationCanvas = segmentationCanvasRef.current;

    if (!imageCanvas || !segmentationCanvas) return;

    const imageCtx = imageCanvas.getContext("2d");
    const segCtx = segmentationCanvas.getContext("2d");

    if (!imageCtx || !segCtx) return;

    // Calculate canvas size maintaining aspect ratio
    const maxWidth = 800;
    const maxHeight = 600;

    let { width, height } = img;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    // Set canvas dimensions
    imageCanvas.width = width;
    imageCanvas.height = height;
    segmentationCanvas.width = width;
    segmentationCanvas.height = height;

    // Draw image
    imageCtx.drawImage(img, 0, 0, width, height);

    // Store image data for smart segmentation
    const imageData = imageCtx.getImageData(0, 0, width, height);
    setImageInfo({ width, height, data: imageData });

    // Clear segmentation canvas
    segCtx.clearRect(0, 0, width, height);

    // Clear undo stack and save initial state
    setUndoStack([]);
    saveState();
  };

  const saveState = () => {
    const segmentationCanvas = segmentationCanvasRef.current;
    if (!segmentationCanvas) return;

    const segCtx = segmentationCanvas.getContext("2d");
    if (!segCtx) return;

    const imageData = segCtx.getImageData(
      0,
      0,
      segmentationCanvas.width,
      segmentationCanvas.height
    );
    setUndoStack((prev) => {
      const newStack = [...prev, imageData];
      // Limit undo stack size
      if (newStack.length > 20) {
        return newStack.slice(1);
      }
      return newStack;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "smart") {
      smartSegmentation(e);
    } else {
      startDrawing(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "paint" && isDrawing) {
      draw(e);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    saveState();
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const segmentationCanvas = segmentationCanvasRef.current;
    if (!segmentationCanvas) return;

    const segCtx = segmentationCanvas.getContext("2d");
    if (!segCtx) return;

    const rect = segmentationCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (segmentationCanvas.width / rect.width);
    const y =
      (e.clientY - rect.top) * (segmentationCanvas.height / rect.height);

    segCtx.globalCompositeOperation = "source-over";
    segCtx.fillStyle = currentColor;
    segCtx.beginPath();
    segCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    segCtx.fill();
  };

  const smartSegmentation = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageInfo.data) return;

    saveState();

    const segmentationCanvas = segmentationCanvasRef.current;
    if (!segmentationCanvas) return;

    const segCtx = segmentationCanvas.getContext("2d");
    if (!segCtx) return;

    const rect = segmentationCanvas.getBoundingClientRect();
    const x = Math.floor(
      (e.clientX - rect.left) * (segmentationCanvas.width / rect.width)
    );
    const y = Math.floor(
      (e.clientY - rect.top) * (segmentationCanvas.height / rect.height)
    );

    // Get the color at the clicked point
    const targetColor = getPixelColor(x, y);

    // Perform flood fill with tolerance
    floodFill(x, y, targetColor, currentColor);
  };

  const getPixelColor = (x: number, y: number) => {
    if (!imageInfo.data) return { r: 0, g: 0, b: 0, a: 0 };

    const index = (y * imageInfo.width + x) * 4;
    return {
      r: imageInfo.data.data[index],
      g: imageInfo.data.data[index + 1],
      b: imageInfo.data.data[index + 2],
      a: imageInfo.data.data[index + 3],
    };
  };

  const colorDistance = (
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ) => {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const floodFill = (
    startX: number,
    startY: number,
    targetColor: { r: number; g: number; b: number },
    fillColor: string
  ) => {
    const segmentationCanvas = segmentationCanvasRef.current;
    if (!segmentationCanvas || !imageInfo.data) return;

    const segCtx = segmentationCanvas.getContext("2d");
    if (!segCtx) return;

    const width = imageInfo.width;
    const height = imageInfo.height;
    const visited = new Set<string>();
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const currentColor = getPixelColor(x, y);
      const distance = colorDistance(currentColor, targetColor);

      if (distance <= tolerance) {
        // Fill this pixel
        segCtx.fillStyle = fillColor;
        segCtx.fillRect(x, y, 1, 1);

        // Add neighboring pixels to stack
        stack.push({ x: x + 1, y: y });
        stack.push({ x: x - 1, y: y });
        stack.push({ x: x, y: y + 1 });
        stack.push({ x: x, y: y - 1 });
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const undo = () => {
    if (undoStack.length > 1) {
      const newStack = [...undoStack];
      newStack.pop(); // Remove current state
      const previousState = newStack[newStack.length - 1];

      const segmentationCanvas = segmentationCanvasRef.current;
      if (!segmentationCanvas) return;

      const segCtx = segmentationCanvas.getContext("2d");
      if (!segCtx) return;

      segCtx.putImageData(previousState, 0, 0);
      setUndoStack(newStack);
    }
  };

  const clearSegmentation = () => {
    const segmentationCanvas = segmentationCanvasRef.current;
    if (!segmentationCanvas) return;

    const segCtx = segmentationCanvas.getContext("2d");
    if (!segCtx) return;

    segCtx.clearRect(0, 0, segmentationCanvas.width, segmentationCanvas.height);
    setUndoStack([]);
    saveState();
  };

  const saveSegmentation = () => {
    const timestamp = new Date().getTime();
    const imageCanvas = imageCanvasRef.current;
    const segmentationCanvas = segmentationCanvasRef.current;

    if (!imageCanvas || !segmentationCanvas) return;

    // Aguardar um pouco antes do próximo download
    setTimeout(() => {
      // 2. Salvar apenas a segmentação (com fundo transparente)
      const segmentationLink = document.createElement("a");
      segmentationLink.download = `segmentacao_${timestamp}.png`;
      segmentationLink.href = segmentationCanvas.toDataURL();
      segmentationLink.click();

      setTimeout(() => {
        // 3. Salvar composição (original + segmentação)
        const compositeCanvas = document.createElement("canvas");
        const compositeCtx = compositeCanvas.getContext("2d");

        if (!compositeCtx) return;

        compositeCanvas.width = imageCanvas.width;
        compositeCanvas.height = imageCanvas.height;

        // Draw original image
        compositeCtx.drawImage(imageCanvas, 0, 0);

        // Draw segmentation with opacity
        compositeCtx.globalAlpha = opacity;
        compositeCtx.drawImage(segmentationCanvas, 0, 0);

        const compositeLink = document.createElement("a");
        compositeLink.download = `composicao_${timestamp}.png`;
        compositeLink.href = compositeCanvas.toDataURL();
        compositeLink.click();

        // Mostrar mensagem de sucesso
        alert("2 imagens salvas:\n- Segmentação\n- Composição");
      }, 500);
    }, 500);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const colors = [
    { hex: "#ff0000", name: "Vermelho" },
    { hex: "#00ff00", name: "Verde" },
    { hex: "#0000ff", name: "Azul" },
    { hex: "#ffff00", name: "Amarelo" },
    { hex: "#ff00ff", name: "Magenta" },
    { hex: "#00ffff", name: "Ciano" },
    { hex: "#ffa500", name: "Laranja" },
    { hex: "#800080", name: "Roxo" },
  ];

  const inputClasses =
    "flex-1 h-[1px] bg-[#222] appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:bg-[#c8c8c8] [&::-webkit-slider-thumb]:border-none [&::-moz-range-thumb]:w-[10px] [&::-moz-range-thumb]:h-[10px] [&::-moz-range-thumb]:bg-[#c8c8c8] [&::-moz-range-thumb]:border-none";

  const ghostButtonClasses =
    "px-4 py-2 border border-[#252525] text-[#8d8d8d] text-[11px] tracking-[0.08em] uppercase font-['IBM_Plex_Mono',monospace] transition-colors duration-200 hover:text-[#efefef] hover:border-[#3a3a3a]";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e0e0e0] pb-20 font-['DM_Sans',sans-serif]">
      <FontImport />

      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pt-10 px-6 lg:px-16 pb-6 border-b border-[#222]">
        <div>
          <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#555] tracking-[0.15em] uppercase mb-2.5 lg:pl-12">
            Processamento de Imagem - Segmentação
          </div>
          <h1 className="flex items-center gap-4 text-[30px] lg:text-4xl font-light tracking-[-0.02em] leading-[1.1] text-[#f0f0f0]">
            <Link
              href="/"
              className="flex items-center text-[#888] no-underline transition-all duration-200 hover:text-white"
              title="Voltar para a Home"
            >
              <ArrowLeft size={32} strokeWidth={1} />
            </Link>
            <span>
              <strong className="font-medium text-white">Segmentação</strong> de
              Imagens
            </span>
          </h1>
        </div>
        <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#444] text-left lg:text-right leading-[1.8]">
          <div>Flood Fill · Brush Overlay · PNG Export</div>
        </div>
      </header>

      <div className="px-6 lg:px-16">
        <div className="flex items-center gap-6 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#444] tracking-[0.2em] uppercase pt-10 pb-4 mb-8 border-b border-[#1a1a1a]">
          01 <span className="text-[#333]">-</span> Ferramenta interativa
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-0.5 bg-[#1a1a1a] mb-0.5">
          <div className="bg-[#0d0d0d] p-6 lg:p-8">
            <div className="flex items-baseline gap-4 mb-7 pb-5 border-b border-[#1e1e1e]">
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">
                painel
              </span>
              <span className="text-[22px] font-normal text-[#ececec] tracking-[-0.01em]">
                Controles
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#3a3a3a] ml-auto">
                .png
              </span>
            </div>

            <div
              ref={uploadAreaRef}
              className={`border border-dashed p-5 mb-6 transition-colors ${
                isDragging
                  ? "border-[#6b6b6b] bg-[#151515]"
                  : "border-[#272727] bg-[#111]"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p className="text-[13px] font-light text-[#888] leading-[1.7] mb-4">
                {imageLoaded
                  ? "Imagem carregada. Você pode arrastar outra imagem para substituir."
                  : "Arraste uma imagem para cá ou selecione um arquivo para iniciar a segmentação."}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2.5 border border-[#2c2c2c] text-[#b4b4b4] text-[11px] tracking-[0.08em] uppercase font-['IBM_Plex_Mono',monospace] transition-colors duration-200 hover:text-[#efefef] hover:border-[#4a4a4a]"
              >
                {imageLoaded ? "Trocar imagem" : "Escolher imagem"}
              </button>
            </div>

            <div className="mb-6">
              <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] mb-3">
                MODO
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("smart")}
                  className={`${ghostButtonClasses} ${
                    mode === "smart"
                      ? "border-[#5a5a5a] text-[#f0f0f0] bg-[#151515]"
                      : ""
                  }`}
                >
                  Inteligente
                </button>
                <button
                  onClick={() => setMode("paint")}
                  className={`${ghostButtonClasses} ${
                    mode === "paint"
                      ? "border-[#5a5a5a] text-[#f0f0f0] bg-[#151515]"
                      : ""
                  }`}
                >
                  Pincel
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] mb-3">
                PALETA
              </div>
              <div className="grid grid-cols-8 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setCurrentColor(color.hex)}
                    className={`w-full aspect-square border transition-all duration-150 ${
                      currentColor === color.hex
                        ? "border-[#f0f0f0]"
                        : "border-[#2b2b2b] hover:border-[#595959]"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3.5 mb-6">
              <div className="flex items-center gap-4">
                <span className="w-32.5 shrink-0 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#444] tracking-[0.08em]">
                  TAMANHO PINCEL
                </span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className={inputClasses}
                />
                <span className="w-10.5 shrink-0 text-right font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555]">
                  {brushSize}px
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-32.5 shrink-0 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#444] tracking-[0.08em]">
                  TOLERANCIA
                </span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  className={inputClasses}
                />
                <span className="w-10.5 shrink-0 text-right font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555]">
                  {tolerance}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-32.5 shrink-0 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#444] tracking-[0.08em]">
                  OPACIDADE
                </span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className={inputClasses}
                />
                <span className="w-10.5 shrink-0 text-right font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555]">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button onClick={clearSegmentation} className={ghostButtonClasses}>
                Limpar
              </button>
              <button onClick={undo} className={ghostButtonClasses}>
                Desfazer
              </button>
              <button onClick={saveSegmentation} className={ghostButtonClasses}>
                Salvar 2x
              </button>
            </div>
          </div>

          <div className="bg-[#0d0d0d] p-6 lg:p-8">
            <div className="flex items-baseline gap-4 mb-7 pb-5 border-b border-[#1e1e1e]">
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">
                area
              </span>
              <span className="text-[22px] font-normal text-[#ececec] tracking-[-0.01em]">
                Preview
              </span>
              <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#3a3a3a] ml-auto">
                overlay
              </span>
            </div>

            <div className="relative overflow-hidden min-h-105 bg-[#111] border border-[#1e1e1e] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {imageLoaded ? (
                <div className="inline-block relative z-10">
                  <canvas
                    ref={imageCanvasRef}
                    className="block max-w-full h-auto"
                  />
                  <canvas
                    ref={segmentationCanvasRef}
                    className="absolute top-0 left-0 cursor-crosshair"
                    style={{ opacity }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
              ) : (
                <div className="relative z-10 text-center px-8">
                  <p className="text-[13.5px] font-light text-[#888] leading-[1.75]">
                    Carregue uma imagem para habilitar o canvas de segmentação.
                    No modo inteligente, clique em uma região para aplicar flood
                    fill com base na tolerância. No modo pincel, desenhe
                    livremente sobre o overlay.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col">
              <div className="flex py-2.25 border-b border-[#181818] border-t">
                <span className="w-37.5 shrink-0 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-px">
                  MODO ATIVO
                </span>
                <span className="text-[12.5px] text-[#777] font-light">
                  {mode === "smart" ? "Segmentacao inteligente" : "Pintura manual"}
                </span>
              </div>
              <div className="flex py-2.25 border-b border-[#181818]">
                <span className="w-37.5 shrink-0 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-px">
                  RESOLUCAO
                </span>
                <span className="text-[12.5px] text-[#777] font-light">
                  {imageInfo.width > 0
                    ? `${imageInfo.width} x ${imageInfo.height}px`
                    : "Sem imagem"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        button {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
