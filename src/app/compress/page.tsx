"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

interface ImageInfo {
  dimensions: string;
  size: string;
  format: string;
}

interface CompressionStats {
  sizeReduction: string;
  reductionPercentage: string;
  compressionRatio: string;
}

export default function CompressPage() {
  const [originalImageData, setOriginalImageData] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string>("");
  const [originalImageInfo, setOriginalImageInfo] = useState<ImageInfo | null>(
    null,
  );
  const [compressedImageUrl, setCompressedImageUrl] = useState<string>("");
  const [compressedInfo, setCompressedInfo] = useState<ImageInfo | null>(null);
  const [compressionStats, setCompressionStats] =
    useState<CompressionStats | null>(null);
  const [currentCompressionType, setCurrentCompressionType] =
    useState<string>("jpeg");
  const [quality, setQuality] = useState<number>(80);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSampleImage();
  }, []);

  useEffect(() => {
    if (!originalImageData) {
      setOriginalPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(originalImageData);
    setOriginalPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [originalImageData]);

  const loadSampleImage = async () => {
    try {
      const response = await fetch("/images/mandrill.png");
      const blob = await response.blob();
      const file = new File([blob], "mandrill.png", { type: "image/png" });

      setOriginalImageData(file);
      loadOriginalImage(file);
      setIsImageLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
    }
  };

  const loadOriginalImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const info: ImageInfo = {
          dimensions: `${img.naturalWidth} × ${img.naturalHeight}px`,
          size: formatFileSize(file.size),
          format: file.type.split("/")[1].toUpperCase(),
        };
        setOriginalImageInfo(info);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    setOriginalImageData(file);
    loadOriginalImage(file);
    setIsImageLoaded(true);

    // Limpa a imagem comprimida anterior para evitar comparação visual enganosa.
    setCompressedImageUrl("");
    setCompressedInfo(null);
    setCompressionStats(null);
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

  const simulateFractalCompression = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): string => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(data[i] / 16) * 16;
      data[i + 1] = Math.floor(data[i + 1] / 16) * 16;
      data[i + 2] = Math.floor(data[i + 2] / 16) * 16;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.6);
  };

  const simulateDCTCompression = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    compressionQuality: number,
  ): string => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const quantFactor = (1 - compressionQuality / 100) * 32 + 1;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / quantFactor) * quantFactor;
      data[i + 1] = Math.round(data[i + 1] / quantFactor) * quantFactor;
      data[i + 2] = Math.round(data[i + 2] / quantFactor) * quantFactor;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/jpeg", compressionQuality / 100);
  };

  const compressImage = () => {
    if (!originalImageData) return;

    setIsProcessing(true);

    setTimeout(() => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        let compressedDataUrl: string;
        let mimeType: string;

        switch (currentCompressionType) {
          case "jpeg":
            mimeType = "image/jpeg";
            compressedDataUrl = canvas.toDataURL(mimeType, quality / 100);
            break;
          case "webp":
            mimeType = "image/webp";
            compressedDataUrl = canvas.toDataURL(mimeType, quality / 100);
            break;
          case "fractal":
            compressedDataUrl = simulateFractalCompression(canvas, ctx);
            mimeType = "image/jpeg";
            break;
          case "dct":
            compressedDataUrl = simulateDCTCompression(canvas, ctx, quality);
            mimeType = "image/jpeg";
            break;
          default:
            mimeType = "image/jpeg";
            compressedDataUrl = canvas.toDataURL(mimeType, quality / 100);
        }

        displayCompressedImage(compressedDataUrl, mimeType);
      };
      img.src = URL.createObjectURL(originalImageData);
    }, 120);
  };

  const displayCompressedImage = (dataUrl: string, mimeType: string) => {
    setCompressedImageUrl(dataUrl);

    const compressedSize = Math.max(1, Math.round(((dataUrl.length - 22) * 3) / 4));
    const originalSize = originalImageData?.size || 1;

    const compressedFormat = mimeType.split("/")[1]?.toUpperCase() || "JPEG";

    const info: ImageInfo = {
      dimensions: originalImageInfo?.dimensions || "-",
      size: formatFileSize(compressedSize),
      format: compressedFormat,
    };
    setCompressedInfo(info);

    const sizeReduction = Math.max(0, originalSize - compressedSize);
    const reductionPercentage =
      originalSize > 0
        ? ((sizeReduction / originalSize) * 100).toFixed(1)
        : "0";
    const compressionRatio =
      compressedSize > 0 ? (originalSize / compressedSize).toFixed(2) : "1.00";

    const stats: CompressionStats = {
      sizeReduction: formatFileSize(sizeReduction),
      reductionPercentage: reductionPercentage + "%",
      compressionRatio: compressionRatio + ":1",
    };
    setCompressionStats(stats);

    setIsProcessing(false);
  };

  const inputClasses =
    "w-full h-[1px] bg-[#222] appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:bg-[#c8c8c8] [&::-webkit-slider-thumb]:border-none [&::-moz-range-thumb]:w-[10px] [&::-moz-range-thumb]:h-[10px] [&::-moz-range-thumb]:bg-[#c8c8c8] [&::-moz-range-thumb]:border-none";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e0e0e0] pb-20 font-['DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        input[type=range]::-webkit-slider-thumb { cursor: grab; }
        input[type=range]::-moz-range-thumb { cursor: grab; border-radius: 0; }
      `}</style>

      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pt-10 px-5 sm:px-8 lg:px-16 pb-6 border-b border-[#222]">
        <div>
          <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#555] tracking-[0.15em] uppercase mb-2.5 pl-12">
            Multimídia - Compressão de Imagens
          </div>
          <h1 className="flex items-center gap-4 text-3xl sm:text-4xl font-light tracking-[-0.02em] leading-[1.1] text-[#f0f0f0]">
            <a
              href="/"
              className="flex items-center text-[#888] no-underline transition-all duration-200 hover:text-white cursor-pointer"
              title="Voltar para a Home"
            >
              <ArrowLeft size={32} strokeWidth={1} />
            </a>
            <span>
              <strong className="font-medium text-white">Compressão</strong> e{" "}
              <strong className="font-medium text-white">Qualidade Visual</strong>
            </span>
          </h1>
        </div>
        <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#444] text-right leading-[1.8]">
          <div>JPEG - WEBP - DCT - Fractal - Compressão com perda</div>
        </div>
      </header>

      <div className="px-5 sm:px-8 lg:px-16">
        <div className="flex items-center gap-6 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#444] tracking-[0.2em] uppercase pt-10 pb-4 mb-4 border-b border-[#1a1a1a]">
          01 <span className="text-[#333]">-</span> Laboratório de Compressão Interativo
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-0.5 bg-[#1a1a1a] mb-0.5">
          <div className="bg-[#0d0d0d] p-6 sm:p-8 lg:p-10 pt-5 flex flex-col">
            <div className="flex items-baseline gap-4 w-full mb-7 pb-5 border-b border-[#1e1e1e]">
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">
                Entrada
              </span>
              <span className="text-[22px] font-normal text-[#ececec] tracking-[-0.01em]">
                Imagem Original
              </span>
            </div>



            <div className="w-full flex aspect-square bg-[#111] border border-[#1e1e1e] items-center justify-center p-2 mb-6">
              {originalPreviewUrl ? (
                <img
                  src={originalPreviewUrl}
                  alt="Imagem original"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#555]">
                  Nenhuma imagem carregada
                </div>
              )}
            </div>

                        <div
              className={`mb-6 border border-dashed rounded bg-[#111] transition-colors cursor-pointer ${
                isDragging
                  ? "border-[#6f8f6f]"
                  : "border-[#2a2a2a] hover:border-[#454545]"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <button
                type="button"
                className="w-full text-center px-4 py-3 font-['IBM_Plex_Mono',monospace] text-[11px] text-[#777] hover:text-[#b8b8b8] transition-colors cursor-pointer"
              >
                {isImageLoaded
                  ? "Trocar imagem (arraste ou clique)"
                  : "Carregar imagem (arraste ou clique)"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="bg-[#101010] border border-[#1e1e1e] p-4">
              <div className="flex justify-between mb-2">
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                  Dimensões
                </span>
                <span className="text-[13px] text-[#cfcfcf]">
                  {originalImageInfo?.dimensions || "-"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                  Tamanho
                </span>
                <span className="text-[13px] text-[#cfcfcf]">
                  {originalImageInfo?.size || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                  Formato
                </span>
                <span className="text-[13px] text-[#cfcfcf]">
                  {originalImageInfo?.format || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#0d0d0d] p-6 sm:p-8 lg:p-10 pt-5 flex flex-col">
            <div className="flex items-baseline gap-4 w-full mb-7 pb-5 border-b border-[#1e1e1e]">
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">
                Saída
              </span>
              <span className="text-[22px] font-normal text-[#ececec] tracking-[-0.01em]">
                Imagem Comprimida
              </span>
            </div>

            <div className="w-full flex aspect-square bg-[#111] border border-[#1e1e1e] items-center justify-center p-2 mb-6">
              {compressedImageUrl ? (
                <img
                  src={compressedImageUrl}
                  alt="Imagem comprimida"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#555] text-center px-4">
                  Selecione um algoritmo e clique em "Comprimir"
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#1a1a1a]">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                {["jpeg", "webp", "dct", "fractal"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setCurrentCompressionType(type)}
                    className={`font-['IBM_Plex_Mono',monospace] text-[11px] tracking-[0.08em] uppercase px-3 py-1.5 border transition-colors cursor-pointer ${
                      currentCompressionType === type
                        ? "border-[#6a3f3f] bg-[#1c0f0f] text-[#d9a6a6]"
                        : "border-[#252525] bg-[#111] text-[#747474] hover:text-[#b8b8b8]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {currentCompressionType !== "fractal" && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                      Qualidade
                    </span>
                    <span className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#a8a8a8]">
                      {quality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                    className={inputClasses}
                  />
                </div>
              )}

              <button
                onClick={compressImage}
                disabled={isProcessing || !isImageLoaded}
                className="w-full font-['IBM_Plex_Mono',monospace] text-[11px] tracking-widest uppercase text-[#d2b0b0] px-3 py-2 border border-[#4a2323] bg-[#1a0c0c] hover:border-[#6a2f2f] hover:text-[#f1c7c7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? "Processando..." : "Comprimir"}
              </button>
            </div>

            {isProcessing && (
              <div className="mt-5 font-['IBM_Plex_Mono',monospace] text-[11px] text-[#9d6d6d]">
                Gerando imagem comprimida...
              </div>
            )}

            {compressedInfo && compressionStats && (
              <div className="mt-6 bg-[#101010] border border-[#1e1e1e] p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                    Novo tamanho
                  </span>
                  <span className="text-[13px] text-[#cfcfcf]">{compressedInfo.size}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                    Formato
                  </span>
                  <span className="text-[13px] text-[#cfcfcf]">{compressedInfo.format}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                    Redução
                  </span>
                  <span className="text-[13px] text-[#cfcfcf]">{compressionStats.reductionPercentage}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                    Economia
                  </span>
                  <span className="text-[13px] text-[#cfcfcf]">{compressionStats.sizeReduction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#666] uppercase tracking-[0.08em]">
                    Taxa
                  </span>
                  <span className="text-[13px] text-[#cfcfcf]">{compressionStats.compressionRatio}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0d0d0d] py-10 px-5 sm:px-8 lg:px-10 border-t-2 border-[#1a1a1a]">
          <div className="flex items-center gap-6 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#444] tracking-[0.2em] uppercase pb-4 mb-6 border-b border-[#1a1a1a]">
            02 <span className="text-[#333]">-</span> Teoria e Análise de Compressão
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <h3 className="text-[15px] font-medium text-[#ccc] mb-4">
                Como a compressão reduz o tamanho?
              </h3>
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-5">
                Algoritmos de compressão removem redundâncias de cor e detalhe que
                o olho humano percebe menos. O resultado é um arquivo menor,
                mais leve para armazenamento e transmissão.
              </p>
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75]">
                Nesta interface, você compara algoritmos com perda e observa o
                impacto direto na nitidez, nas texturas finas e no peso final da
                imagem.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-[#ccc] mb-4">
                Leitura rápida dos algoritmos
              </h3>
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-5">
                <strong>JPEG / WEBP:</strong> codecs padrão com ajuste contínuo
                de qualidade para equilibrar fidelidade e tamanho.
              </p>
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-5">
                <strong>DCT simulada:</strong> mostra o efeito de quantização,
                reduzindo variações sutis de pixel para economizar dados.
              </p>
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75]">
                <strong>Fractal simulada:</strong> prioriza padrões globais da
                imagem e tende a criar aspecto mais suavizado em detalhes finos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
