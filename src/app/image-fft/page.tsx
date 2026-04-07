"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FFTProcessor, type Complex, type FFTResult } from "@/lib/FFTProcessor";

enum DrawMode {
  BRUSH = "brush",
  CIRCLE = "circle",
}

export default function ImageFFTPage() {
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
    // Create a simple test pattern
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, "#6366f1");
    gradient.addColorStop(1, "#a78bfa");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Process the default image for FFT
    processImage();
    setImageLoaded(true);
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

    if (showPreview && fftStateRef.current.hoverX >= 0 && fftStateRef.current.hoverY >= 0) {
      fftCtx.beginPath();
      fftCtx.arc(
        fftStateRef.current.hoverX,
        fftStateRef.current.hoverY,
        fftStateRef.current.brushSize,
        0,
        Math.PI * 2
      );
      fftCtx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      fftCtx.lineWidth = 1;
      fftCtx.stroke();
    }
  };

  const fftShift = (
    imageData: ImageData,
    width: number,
    height: number
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
    ctx: CanvasRenderingContext2D
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

        if (fftStateRef.current.isDrawing && fftStateRef.current.drawMode === DrawMode.BRUSH) {
          drawOnFFT(e, false);
        } else {
          displayFFT(true);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (fftStateRef.current.isDrawing && fftStateRef.current.drawMode === DrawMode.BRUSH) {
        displayFFT(true);
        reconstructImage();
      }

      fftStateRef.current.isDrawing = false;
      fftStateRef.current.lastDrawX = -1;
      fftStateRef.current.lastDrawY = -1;
    };

    const onMouseLeave = () => {
      if (fftStateRef.current.isDrawing && fftStateRef.current.drawMode === DrawMode.BRUSH) {
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
        y
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
    y1: number
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Header */}
      <header className="relative px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900">
        <Link
          href="/"
          className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <span>←</span> <span className="text-sm font-medium">Voltar</span>
        </Link>
        <h1 className="text-xl font-medium tracking-tight">Editor de Imagens FFT</h1>
        <div className="w-16" />
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 flex flex-col xl:flex-row gap-6">
        {/* Left Column: Original (Reconstructed) Image */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
            Imagem Reconstruida
          </h2>
          <div className="flex-1 flex items-center justify-center min-h-[500px]">
            <canvas
              ref={originalCanvasRef}
              className="max-w-full max-h-[80vh] border border-neutral-700 bg-black object-contain"
              style={{ cursor: "default" }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-neutral-800" />

        {/* Right Column: Frequency Domain & Controls */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
              Domínio da Frequência
            </h2>
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 bg-transparent border-0 px-0 py-2 rounded-md">
              <label className="cursor-pointer text-sm font-medium hover:text-indigo-400 transition-colors whitespace-nowrap">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                [ Carregar Imagem ]
              </label>

              <div className="w-px h-4 bg-neutral-700"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-medium uppercase">Tamanho</span>
                <input
                  type="range"
                  min="1"
                  max="256"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-20 accent-neutral-500"
                />
                <span className="text-xs font-mono text-neutral-400 w-6 text-right">
                  {brushSize}
                </span>
              </div>

              <div className="w-px h-4 bg-neutral-700"></div>

              <button
                onClick={resetFFT}
                className="text-sm text-neutral-300 hover:text-white transition-colors"
                title="Resetar edições"
              >
                Resetar FFT
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[500px]">
             <canvas
                ref={fftCanvasRef}
                className="max-w-full max-h-[80vh] border border-neutral-700 bg-black object-contain"
                style={{ cursor: "crosshair" }}
              />
          </div>
        </div>
      </main>

      {/* Info Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 p-8">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-lg font-medium mb-3">O que é a Transformada Rápida de Fourier (FFT)?</h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-4">
            A Transformada Rápida de Fourier (FFT) aplicada a imagens converte a informação de 
            <strong> pixels (domínio espacial)</strong> para <strong>frequências (domínio da frequência)</strong>. 
            Em vez de olhar para a intensidade de luz em cada coordenada (x, y), você visualiza quão rápido 
            as intensidades mudam na imagem. O centro do espectro representa frequências baixas 
            (transições suaves, como o céu ou superfícies lisas), enquanto as bordas representam 
            frequências altas (detalhes finos, texturas e bordas acentuadas).
          </p>
          <p className="text-neutral-400 text-sm leading-relaxed">
            <strong>Como usar esta ferramenta:</strong> Edite o espectro visualizado no &quot;Domínio da Frequência&quot; 
            para ver o impacto direto na imagem reconstruída. Apagar frequências (pintando de preto 
            ou escurecendo) ao redor do centro remove frequências altas, aplicando um filtro passa-baixas (desfoque). 
            Se você apagar o centro e preservar as pontas, aplicará um filtro passa-altas, realçando 
            apenas as bordas e contornos. Experimente o Pincel Preto Absoluto para remover agressivamente 
            frequências específicas!
          </p>
        </div>
      </footer>
    </div>
  );
}
