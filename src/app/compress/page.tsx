"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
  const [originalImageInfo, setOriginalImageInfo] = useState<ImageInfo | null>(
    null
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
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLennaImage(); // TODO: Lenna isnt used anymore
  }, []);

  // TODO: Lenna isnt used anymore
  const loadLennaImage = async () => { 
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
    ctx: CanvasRenderingContext2D
  ): string => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Aplicar um filtro que simula perda de dados fractais
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(data[i] / 16) * 16; // Red
      data[i + 1] = Math.floor(data[i + 1] / 16) * 16; // Green
      data[i + 2] = Math.floor(data[i + 2] / 16) * 16; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.6);
  };

  const simulateDCTCompression = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    quality: number
  ): string => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Aplicar quantização simulada
    const quantFactor = (1 - quality / 100) * 32 + 1;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / quantFactor) * quantFactor;
      data[i + 1] = Math.round(data[i + 1] / quantFactor) * quantFactor;
      data[i + 2] = Math.round(data[i + 2] / quantFactor) * quantFactor;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/jpeg", quality / 100);
  };

  const compressImage = () => {
    if (!originalImageData) return;

    setIsProcessing(true);

    setTimeout(() => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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
    }, 100);
  };

  const displayCompressedImage = (dataUrl: string, mimeType: string) => {
    setCompressedImageUrl(dataUrl);

    // Calculate compressed size (approximation from data URL)
    const compressedSize = Math.max(
      1,
      Math.round(((dataUrl.length - 22) * 3) / 4)
    ); // nunca zero
    const originalSize = originalImageData?.size || 1; // nunca zero

    const compressedInfo: ImageInfo = {
      dimensions: originalImageInfo?.dimensions || "",
      size: formatFileSize(compressedSize),
      format: currentCompressionType.toUpperCase(),
    };
    setCompressedInfo(compressedInfo);

    // Calculate and display comparison stats
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

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-500 text-white px-6 py-3 rounded-full text-base font-semibold transition-all duration-300 hover:-translate-y-0.5"
      >
        ← Voltar
      </Link>

      <div className="max-w-7xl mx-auto mt-20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">
            Compressão de Imagens
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Compare diferentes algoritmos de compressão e veja como eles afetam
            o tamanho e qualidade das suas imagens
          </p>
        </div>

        {/* Upload Section */}
        <div
          ref={uploadSectionRef}
          className={`bg-white/10 border-2 border-dashed border-white/30 rounded-2xl p-10 text-center mb-8 backdrop-blur-md transition-all duration-300 ${
            isDragging
              ? "border-green-400 bg-green-400/10"
              : "hover:border-white/50 hover:bg-white/15"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex gap-3 items-center justify-center">
            <div className="text-4xl mb-6 opacity-70">
              {isImageLoaded ? "✅" : "📁"}
            </div>
            <div className="text-xl text-white mb-6">
              {isImageLoaded
                ? "Imagem carregada com sucesso!"
                : "Arraste uma imagem aqui ou clique para selecionar"}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold cursor-pointer"
          >
            {isImageLoaded ? "Trocar Imagem" : "Escolher Imagem"}
          </button>
        </div>

        {/* Content Grid */}
        {isImageLoaded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Image Panel */}
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20">
              <h3 className="flex justify-center text-2xl font-semibold text-white mb-4 pb-2 border-b border-white/20">
                Imagem Original
              </h3>

              <div className="bg-black/30 rounded-xl p-5 mb-6 min-h-[300px] flex items-center justify-center">
                {originalImageData && (
                  <img
                    src={URL.createObjectURL(originalImageData)}
                    alt="Imagem original"
                    className="max-w-full max-h-[300px] rounded-lg shadow-lg"
                  />
                )}
              </div>

              <div className="bg-black/20 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/80 font-medium">Dimensões:</span>
                  <span className="text-green-400 font-bold">
                    {originalImageInfo?.dimensions || "-"}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/80 font-medium">Tamanho:</span>
                  <span className="text-green-400 font-bold">
                    {originalImageInfo?.size || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80 font-medium">Formato:</span>
                  <span className="text-green-400 font-bold">
                    {originalImageInfo?.format || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Compressed Image Panel */}
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20">
              <h3 className="flex justify-center text-2xl font-semibold text-white mb-4 pb-2 border-b border-white/20">
                Imagem Comprimida
              </h3>

              <div className="bg-black/30 rounded-xl p-5 mb-6 min-h-[300px] flex items-center justify-center">
                {compressedImageUrl ? (
                  <img
                    src={compressedImageUrl}
                    alt="Imagem comprimida"
                    className="max-w-full max-h-[300px] rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="text-white/60">
                    Configure a compressão e clique em &apos;Comprimir&apos;
                  </div>
                )}
              </div>

              {/* Compression Controls */}
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-white/80 font-medium mb-3">
                    Tipo de Compressão:
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {["jpeg", "webp", "fractal", "dct"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setCurrentCompressionType(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          currentCompressionType === type
                            ? "bg-gradient-to-r from-orange-800 to-red-800 text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {currentCompressionType !== "fractal" && (
                  <div className="mb-4">
                    <label className="block text-white/80 font-medium mb-3">
                      Qualidade:{" "}
                      <span className="text-orange-400 px-2 py-1 rounded text-sm font-bold">
                        {quality}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}

                <button
                  onClick={compressImage}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r  from-orange-800 to-red-800 text-white py-3 rounded-full font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processando..." : "Comprimir Imagem"}
                </button>
              </div>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="text-center text-orange-400 font-semibold mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
                  Processando...
                </div>
              )}

              {/* Compressed Image Info */}
              {compressedInfo && (
                <div className="bg-black/20 rounded-xl p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/80 font-medium">
                      Novo Tamanho:
                    </span>
                    <span className="text-green-400 font-bold">
                      {compressedInfo.size}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/80 font-medium">
                      Algoritmo:
                    </span>
                    <span className="text-green-400 font-bold">
                      {compressedInfo.format}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80 font-medium">
                      Qualidade:
                    </span>
                    <span className="text-green-400 font-bold">
                      {currentCompressionType === "fractal"
                        ? "Automática"
                        : quality + "%"}
                    </span>
                  </div>
                </div>
              )}

              {/* Comparison Stats */}
              {compressionStats && (
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/80 font-medium">
                      Redução de Tamanho:
                    </span>
                    <span
                      className={`font-bold ${
                        parseFloat(compressionStats.reductionPercentage) > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {compressionStats.sizeReduction}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/80 font-medium">
                      Percentual de Redução:
                    </span>
                    <span
                      className={`font-bold ${
                        parseFloat(compressionStats.reductionPercentage) > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {compressionStats.reductionPercentage}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80 font-medium">
                      Taxa de Compressão:
                    </span>
                    <span className="text-green-400 font-bold">
                      {compressionStats.compressionRatio}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ff6b35;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ff6b35;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
