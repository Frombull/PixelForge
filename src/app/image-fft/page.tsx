"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { FFTProcessor, type Complex, type FFTResult } from "@/lib/FFTProcessor";
import { useTheme } from "@/lib/theme";
import { Slider } from "@/components/ui/Slider";

enum DrawMode {
  BRUSH = "brush",
  CIRCLE = "circle",
}

export default function ImageFFTPage() {
  const { theme, toggleTheme } = useTheme();
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>(DrawMode.BRUSH);
  const [brushSize, setBrushSize] = useState(20);
  const [imageLoaded, setImageLoaded] = useState(false);

  // FFT state
  const fftStateRef = useRef({
    originalImg: null as HTMLImageElement | null,
    imgData: null as ImageData | null,
    fftMagnitudeData: [] as number[],
    fftPhaseData: [] as number[],
    originalFFTMagnitude: [] as number[],
    originalFFTPhase: [] as number[],
    maxFFTValue: 0,
    isDrawing: false,
    hoverX: -1,
    hoverY: -1,
    lastDrawX: -1,
    lastDrawY: -1,
    drawMode: DrawMode.BRUSH,
    brushSize: 20,
  });

  // Sync state to ref for event listeners
  useEffect(() => {
    fftStateRef.current.drawMode = drawMode;
    fftStateRef.current.brushSize = brushSize;
  }, [drawMode, brushSize]);

  useEffect(() => {
    const originalCanvas = originalCanvasRef.current;
    const fftCanvas = fftCanvasRef.current;

    if (!originalCanvas || !fftCanvas) return;

    const originalCtx = originalCanvas.getContext("2d");
    const fftCtx = fftCanvas.getContext("2d");

    if (!originalCtx || !fftCtx) return;

    // Setup canvas
    originalCanvas.width = 512;
    originalCanvas.height = 512;
    fftCanvas.width = 512;
    fftCanvas.height = 512;

    // Initialize with a default image or pattern
    initializeDefaultImage(originalCtx);

    // Setup FFT canvas event listeners
    setupFFTCanvas(fftCanvas, fftCtx);
  }, []);

  const initializeDefaultImage = (ctx: CanvasRenderingContext2D) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let drawWidth: number, drawHeight: number;

      if (aspectRatio > 1) {
        drawWidth = 512;
        drawHeight = 512 / aspectRatio;
      } else {
        drawWidth = 512 * aspectRatio;
        drawHeight = 512;
      }

      const x = (512 - drawWidth) / 2;
      const y = (512 - drawHeight) / 2;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      processImage();
      setImageLoaded(true);
    };
    img.src = "/images/ArchLinux_logo.jpg";
  };

  const processImage = () => {
    const originalCanvas = originalCanvasRef.current;
    const originalCtx = originalCanvas?.getContext("2d");

    if (!originalCtx) return;

    const imgData = originalCtx.getImageData(0, 0, 512, 512);
    fftStateRef.current.imgData = imgData;

    // Convert to grayscale
    const grayData: number[] = [];
    for (let i = 0; i < imgData.data.length; i += 4) {
      const r = imgData.data[i];
      const g = imgData.data[i + 1];
      const b = imgData.data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      grayData.push(gray);
    }

    // Calculate FFT
    const fftResult = FFTProcessor.compute2DFFT(grayData, 512, 512);

    fftStateRef.current.fftMagnitudeData = fftResult.magnitude;
    fftStateRef.current.fftPhaseData = fftResult.phase;
    fftStateRef.current.originalFFTMagnitude = [...fftResult.magnitude];
    fftStateRef.current.originalFFTPhase = [...fftResult.phase];

    // Find max FFT value
    fftStateRef.current.maxFFTValue = 0;
    for (let i = 0; i < fftResult.magnitude.length; i++) {
      if (fftResult.magnitude[i] > fftStateRef.current.maxFFTValue) {
        fftStateRef.current.maxFFTValue = fftResult.magnitude[i];
      }
    }

    displayFFT();
    // Convert source directly to grayscale immediately so the left canvas shows it grayscaled.
    reconstructImage();
  };

  const displayFFT = (showPreview = false) => {
    const fftCanvas = fftCanvasRef.current;
    const fftCtx = fftCanvas?.getContext("2d");

    if (!fftCtx || fftStateRef.current.fftMagnitudeData.length === 0) return;

    const fftMagnitudeDisplay = [...fftStateRef.current.fftMagnitudeData];
    const maxMag = fftStateRef.current.maxFFTValue;

    const imageData = fftCtx.createImageData(512, 512);

    for (let i = 0; i < fftMagnitudeDisplay.length; i++) {
      const normalizedMag =
        Math.log(1 + fftMagnitudeDisplay[i]) / Math.log(1 + maxMag);
      const value = Math.max(0, Math.min(255, Math.round(normalizedMag * 255)));

      const idx = i * 4;
      imageData.data[idx] = value; // R
      imageData.data[idx + 1] = value; // G
      imageData.data[idx + 2] = value; // B
      imageData.data[idx + 3] = 255; // A
    }

    const shiftedImageData = fftShift(imageData, 512, 512);
    fftCtx.putImageData(shiftedImageData, 0, 0);

    if (
      showPreview &&
      fftStateRef.current.hoverX >= 0 &&
      fftStateRef.current.hoverY >= 0
    ) {
      fftCtx.beginPath();
      fftCtx.arc(
        fftStateRef.current.hoverX,
        fftStateRef.current.hoverY,
        fftStateRef.current.brushSize,
        0,
        Math.PI * 2,
      );
      fftCtx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      fftCtx.lineWidth = 1;
      fftCtx.stroke();
    }
  };

  const fftShift = (
    imageData: ImageData,
    width: number,
    height: number,
  ): ImageData => {
    const fftCtx = fftCanvasRef.current?.getContext("2d");
    if (!fftCtx) return imageData;

    const shifted = fftCtx.createImageData(width, height);
    const halfW = Math.floor(width / 2);
    const halfH = Math.floor(height / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = (x + halfW) % width;
        const srcY = (y + halfH) % height;

        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * width + x) * 4;

        shifted.data[dstIdx] = imageData.data[srcIdx];
        shifted.data[dstIdx + 1] = imageData.data[srcIdx + 1];
        shifted.data[dstIdx + 2] = imageData.data[srcIdx + 2];
        shifted.data[dstIdx + 3] = imageData.data[srcIdx + 3];
      }
    }

    return shifted;
  };

  const reconstructImage = () => {
    const originalCanvas = originalCanvasRef.current;
    const originalCtx = originalCanvas?.getContext("2d");

    if (!originalCtx || fftStateRef.current.fftMagnitudeData.length === 0)
      return;

    const complexData: Complex[] = [];
    for (let i = 0; i < fftStateRef.current.fftMagnitudeData.length; i++) {
      const mag = fftStateRef.current.fftMagnitudeData[i];
      const phase = fftStateRef.current.fftPhaseData[i];

      const real = mag * Math.cos(phase);
      const imag = mag * Math.sin(phase);

      complexData.push({ real, imag });
    }

    const reconstructed = FFTProcessor.compute2DIFFT(complexData, 512, 512);

    let maxVal = -Infinity;
    let minVal = Infinity;

    for (let i = 0; i < reconstructed.length; i++) {
      if (reconstructed[i] > maxVal) maxVal = reconstructed[i];
      if (reconstructed[i] < minVal) minVal = reconstructed[i];
    }

    const imageData = originalCtx.createImageData(512, 512);

    for (let i = 0; i < reconstructed.length; i++) {
      const normalized = (reconstructed[i] - minVal) / (maxVal - minVal);
      const value = Math.max(0, Math.min(255, Math.round(normalized * 255)));

      const idx = i * 4;
      imageData.data[idx] = value; // R
      imageData.data[idx + 1] = value; // G
      imageData.data[idx + 2] = value; // B
      imageData.data[idx + 3] = 255; // A
    }

    originalCtx.putImageData(imageData, 0, 0);
  };

  const setupFFTCanvas = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => {
    const onMouseDown = (e: MouseEvent) => {
      if (fftStateRef.current.fftMagnitudeData.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - rect.left) * 512) / rect.width);
        const y = Math.floor(((e.clientY - rect.top) * 512) / rect.height);

        fftStateRef.current.lastDrawX = -1;
        fftStateRef.current.lastDrawY = -1;
        fftStateRef.current.hoverX = x;
        fftStateRef.current.hoverY = y;
        fftStateRef.current.isDrawing = true;

        if (fftStateRef.current.drawMode === DrawMode.CIRCLE) {
          applyBrushAt(x, y);
          fftStateRef.current.lastDrawX = x;
          fftStateRef.current.lastDrawY = y;
          displayFFT(true);
          reconstructImage();
        } else {
          drawOnFFT(e, false);
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (fftStateRef.current.fftMagnitudeData.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - rect.left) * 512) / rect.width);
        const y = Math.floor(((e.clientY - rect.top) * 512) / rect.height);

        fftStateRef.current.hoverX = x;
        fftStateRef.current.hoverY = y;

        if (
          fftStateRef.current.isDrawing &&
          fftStateRef.current.drawMode === DrawMode.BRUSH
        ) {
          drawOnFFT(e, false);
        } else {
          displayFFT(true);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (
        fftStateRef.current.isDrawing &&
        fftStateRef.current.drawMode === DrawMode.BRUSH
      ) {
        displayFFT(true);
        reconstructImage();
      }

      fftStateRef.current.isDrawing = false;
      fftStateRef.current.lastDrawX = -1;
      fftStateRef.current.lastDrawY = -1;
    };

    const onMouseLeave = () => {
      if (
        fftStateRef.current.isDrawing &&
        fftStateRef.current.drawMode === DrawMode.BRUSH
      ) {
        displayFFT(false);
        reconstructImage();
      }

      fftStateRef.current.isDrawing = false;
      fftStateRef.current.hoverX = -1;
      fftStateRef.current.hoverY = -1;
      fftStateRef.current.lastDrawX = -1;
      fftStateRef.current.lastDrawY = -1;
      displayFFT(false);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  };

  const drawOnFFT = (event: MouseEvent, updateImage = true) => {
    if (fftStateRef.current.fftMagnitudeData.length === 0) return;

    const rect = fftCanvasRef.current!.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) * 512) / rect.width);
    const y = Math.floor(((event.clientY - rect.top) * 512) / rect.height);

    if (x < 0 || x >= 512 || y < 0 || y >= 512) return;

    if (
      fftStateRef.current.lastDrawX >= 0 &&
      fftStateRef.current.lastDrawY >= 0 &&
      (fftStateRef.current.lastDrawX !== x ||
        fftStateRef.current.lastDrawY !== y)
    ) {
      const points = getLinePoints(
        fftStateRef.current.lastDrawX,
        fftStateRef.current.lastDrawY,
        x,
        y,
      );

      for (const point of points) {
        applyBrushAt(point.x, point.y);
      }
    } else {
      applyBrushAt(x, y);
    }

    fftStateRef.current.lastDrawX = x;
    fftStateRef.current.lastDrawY = y;

    if (updateImage) {
      displayFFT(true);
      reconstructImage();
    } else {
      displayFFT(true);
    }
  };

  const getLinePoints = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): Array<{ x: number; y: number }> => {
    const points: Array<{ x: number; y: number }> = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      points.push({ x: x0, y: y0 });

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return points;
  };

  const applyBrushAt = (x: number, y: number) => {
    const halfW = Math.floor(512 / 2);
    const halfH = Math.floor(512 / 2);
    const shiftedX = (x - halfW + 512) % 512;
    const shiftedY = (y - halfH + 512) % 512;
    const currentBrushSize = fftStateRef.current.brushSize;

    for (let dy = -currentBrushSize; dy <= currentBrushSize; dy++) {
      for (let dx = -currentBrushSize; dx <= currentBrushSize; dx++) {
        let px = shiftedX + dx;
        let py = shiftedY + dy;

        px = (px + 512) % 512;
        py = (py + 512) % 512;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= currentBrushSize) {
          const i = py * 512 + px;
          if (i < fftStateRef.current.fftMagnitudeData.length) {
            fftStateRef.current.fftMagnitudeData[i] = 0;
          }
        }
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const originalCanvas = originalCanvasRef.current;
        if (!originalCanvas) return;

        const ctx = originalCanvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas and draw new image
        ctx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 512, 512);

        const aspectRatio = img.width / img.height;
        let drawWidth: number, drawHeight: number;

        if (aspectRatio > 1) {
          drawWidth = 512;
          drawHeight = 512 / aspectRatio;
        } else {
          drawWidth = 512 * aspectRatio;
          drawHeight = 512;
        }

        const x = (512 - drawWidth) / 2;
        const y = (512 - drawHeight) / 2;

        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        processImage();
        setImageLoaded(true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetFFT = () => {
    if (
      fftStateRef.current.originalFFTMagnitude.length > 0 &&
      fftStateRef.current.originalFFTPhase.length > 0
    ) {
      fftStateRef.current.fftMagnitudeData = [
        ...fftStateRef.current.originalFFTMagnitude,
      ];
      fftStateRef.current.fftPhaseData = [
        ...fftStateRef.current.originalFFTPhase,
      ];

      fftStateRef.current.maxFFTValue = 0;
      for (let i = 0; i < fftStateRef.current.fftMagnitudeData.length; i++) {
        if (
          fftStateRef.current.fftMagnitudeData[i] >
          fftStateRef.current.maxFFTValue
        ) {
          fftStateRef.current.maxFFTValue =
            fftStateRef.current.fftMagnitudeData[i];
        }
      }

      displayFFT();
      reconstructImage();
    } else {
      processImage();
    }
  };

  return (
    <div className="pf-surface min-h-screen bg-[var(--pf-bg)] text-[var(--pf-fg)] pb-20 font-sans transition-colors duration-200">
      {/* Header */}
      <header className="flex items-end justify-between gap-8 pt-5 px-16 pb-2 border-b border-[var(--pf-border-strong)]">
        <div className="flex items-baseline gap-4">
          <h1 className="flex items-center gap-4 text-4xl font-light tracking-[-0.02em] leading-[1.1] text-[var(--pf-fg-strong)]">
            <a
              href="/"
              className="flex items-center text-[var(--pf-fg-muted)] no-underline transition-all duration-200 hover:text-[var(--pf-fg-strong)]"
              title="Voltar para a Home"
            >
              <ArrowLeft size={32} strokeWidth={1} />
            </a>
            <span>
              <strong className="font-medium text-[var(--pf-fg-strong)]">
                Domínio Espacial
              </strong>{" "}
              vs{" "}
              <strong className="font-medium text-[var(--pf-fg-strong)]">
                Domínio da Frequência
              </strong>
            </span>
          </h1>
          <span className="font-sans text-[12px] text-[var(--pf-fg-faint)] tracking-[0.15em] uppercase whitespace-nowrap">
            Multimídia - Edição FFT
          </span>
        </div>
        <div className="flex items-start gap-6">
          <div className="font-sans text-[12px] text-[var(--pf-fg-faint)] text-right leading-[1.8]">
            <div>FFT · Domínio da Frequência · Transformada de Fourier · Processamento de Imagens</div>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 shrink-0 text-[var(--pf-fg-muted)] hover:text-[var(--pf-fg-strong)] border border-[var(--pf-border-strong)] hover:border-[var(--pf-accent)] rounded transition-colors"
            title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="px-16 pt-8">
        <div className="grid grid-cols-2 gap-[2px] bg-[var(--pf-border)] mb-[2px]">
          {/* Left Column: Original (Reconstructed) Image */}
          <div className="bg-[var(--pf-bg)] p-10 pt-5 flex flex-col items-center">
            <div className="flex items-baseline gap-4 w-full mb-7 pb-5 border-b border-[var(--pf-border)]">
              <span className="font-sans text-[11px] text-[var(--pf-fg-faint)] tracking-[0.18em] uppercase">
                Visualização
              </span>
              <span className="text-[22px] font-normal text-[var(--pf-fg-strong)] tracking-[-0.01em]">
                Espectro Espacial
              </span>
            </div>

            <div className="w-full flex aspect-square bg-[var(--pf-bg-raised)] border border-[var(--pf-border)] self-center items-center justify-center p-2 mb-auto">
              <canvas
                ref={originalCanvasRef}
                className="w-full h-full object-contain"
                style={{ cursor: "default" }}
              />
            </div>
          </div>

          {/* Right Column: Frequency Domain & Controls */}
          <div className="bg-[var(--pf-bg)] p-10 pt-5 flex flex-col items-center">
            <div className="flex items-baseline gap-4 w-full mb-7 pb-5 border-b border-[var(--pf-border)]">
              <span className="font-sans text-[11px] text-[var(--pf-fg-faint)] tracking-[0.18em] uppercase">
                Edição
              </span>
              <span className="text-[22px] font-normal text-[var(--pf-fg-strong)] tracking-[-0.01em]">
                Espectro Frequência
              </span>
            </div>

            <div className="w-full flex aspect-square bg-[var(--pf-bg-raised)] border border-[var(--pf-border)] self-center items-center justify-center p-2 mb-6">
              <canvas
                ref={fftCanvasRef}
                className="w-full h-full object-contain"
                style={{ cursor: "crosshair" }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-6 w-full pt-6 border-t border-[var(--pf-border)]">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-center gap-6 w-full">
                <label className="cursor-pointer font-sans text-[11px] text-[var(--pf-fg-muted)] tracking-[0.1em] uppercase hover:text-[var(--pf-fg-strong)] transition-colors whitespace-nowrap px-3 py-1.5 border border-[var(--pf-border-strong)] hover:border-[var(--pf-accent)] rounded bg-[var(--pf-bg-raised)]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  Carregar Imagem ⇪
                </label>

                <div className="w-px h-6 bg-[var(--pf-border-strong)]"></div>

                <div className="flex items-center gap-4 min-w-[220px]">
                  <span className="text-[11px] text-[var(--pf-fg-faint)] font-sans tracking-[0.08em] uppercase whitespace-nowrap">
                    Pincel
                  </span>
                  <Slider
                    min={1}
                    max={256}
                    value={brushSize}
                    onChange={setBrushSize}
                    aria-label="Tamanho do pincel"
                    className="w-32"
                  />
                  <span className="text-[11px] font-sans text-[var(--pf-fg-muted)] w-8 text-right tabular-nums">
                    {brushSize}px
                  </span>
                </div>

                <div className="w-px h-6 bg-[var(--pf-border-strong)]"></div>

                <button
                  onClick={resetFFT}
                  className="font-sans text-[11px] text-[var(--pf-danger-fg)] hover:text-[var(--pf-danger-fg-hover)] tracking-[0.1em] uppercase transition-colors px-3 py-1.5 border border-[var(--pf-danger-border)] bg-[var(--pf-danger-bg)] hover:border-[var(--pf-danger-border-hover)] rounded"
                  title="Resetar edições"
                >
                  Resetar FFT ↺
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-[var(--pf-bg)] py-10 px-10 border-t-2 border-[var(--pf-border)]">
          <div className="grid grid-cols-2 gap-16">
            <div>
              <h3 className="text-[15px] font-medium text-[var(--pf-fg)] mb-4">
                O que é a Transformada Rápida de Fourier?
              </h3>
              <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-5">
                A Transformada Rápida de Fourier (FFT) aplicada a imagens
                converte a informação de{" "}
                <code className="font-sans text-[12.5px] text-[var(--pf-code-fg)] bg-[var(--pf-code-bg)] px-[5px] py-[1px]">
                  pixels (domínio espacial)
                </code>{" "}
                para{" "}
                <code className="font-sans text-[12.5px] text-[var(--pf-code-fg)] bg-[var(--pf-code-bg)] px-[5px] py-[1px]">
                  frequências (domínio da frequência)
                </code>
                .
              </p>
              <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-5">
                Em vez de medir a intensidade de luz em cada coordenada (x, y),
                você visualiza quão rápido as intensidades mudam ao longo da
                imagem original. O centro do espectro de frequência representa
                baixas frequências (transições muito suaves ou lentas de cor na
                foto original, como o pano de fundo liso ou um degradê da
                iluminação).
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-[var(--pf-fg)] mb-4">
                Manipulando no Domínio da Frequência
              </h3>
              <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-5">
                As regiões afastadas do centro representam as altas frequências
                (texturas complexas, fios de cabelo e bordas de contraste
                perfeitamente nítidas e secas).
              </p>
              <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-[14px]">
                <strong>Filtro Passa-Baixas: </strong> Use o pincel e tente
                apagar por completo as bordas do espectro (deixando apenas o
                centro iluminado intacto). A imagem gerada à esquerda ficará com
                efeito de{" "}
                <em className="italic">borrão / desfoque gaussiano</em> nativo.
              </p>
              <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-[14px]">
                <strong>Filtro Passa-Altas: </strong> O oposto - ao apagar toda
                a área central concentrada e deixar somente os pontos distantes,
                a imagem gerada não terá preenchimento sólido de cor e será
                construída apenas por bordas (parecendo um "raio x" ou um traço
                à lápis detectando os contornos da foto original).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
