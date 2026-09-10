"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Crop } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgNaturalDim, setImgNaturalDim] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const dragStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerSize = 280; // Size of 1:1 square crop viewport in px

  // Calculate base displayed dimensions (cover fit)
  const aspect = imgNaturalDim.width / (imgNaturalDim.height || 1);
  let baseWidth = containerSize;
  let baseHeight = containerSize;
  if (aspect >= 1) {
    // Landscape: height matches container, width expands
    baseHeight = containerSize;
    baseWidth = containerSize * aspect;
  } else {
    // Portrait: width matches container, height expands
    baseWidth = containerSize;
    baseHeight = containerSize / aspect;
  }

  // Current displayed size
  const displayedWidth = baseWidth * zoom;
  const displayedHeight = baseHeight * zoom;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Load image dimensions
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgNaturalDim({ width: naturalWidth, height: naturalHeight });
  };

  // Pointer drag events for panning the image
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Generate 1:1 Cropped Image Blob using WYSIWYG bounding rect
  const handleConfirmCrop = useCallback(() => {
    if (!imgNaturalDim.width || !imgNaturalDim.height) return;

    const outputSize = 600; // Output square resolution
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // The image displayed origin relative to container top-left:
    // Image center is at (containerSize / 2 + position.x, containerSize / 2 + position.y)
    // So Image top-left in container coords:
    const imgLeft = containerSize / 2 + position.x - displayedWidth / 2;
    const imgTop = containerSize / 2 + position.y - displayedHeight / 2;

    // Viewport is from (0, 0) to (containerSize, containerSize)
    // Crop area relative to displayed image:
    const cropDispX = -imgLeft;
    const cropDispY = -imgTop;
    const cropDispWidth = containerSize;
    const cropDispHeight = containerSize;

    // Scale from displayed dimensions to natural dimensions
    const scaleToNatural = imgNaturalDim.width / displayedWidth;

    const cropNatX = cropDispX * scaleToNatural;
    const cropNatY = cropDispY * scaleToNatural;
    const cropNatWidth = cropDispWidth * scaleToNatural;
    const cropNatHeight = cropDispHeight * scaleToNatural;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        cropNatX,
        cropNatY,
        cropNatWidth,
        cropNatHeight,
        0,
        0,
        outputSize,
        outputSize
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
            onClose();
          }
        },
        "image/jpeg",
        0.92
      );
    };
    img.src = imageSrc;
  }, [imgNaturalDim, position, displayedWidth, displayedHeight, imageSrc, onCropComplete, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "1rem",
      }}
    >
      <div
        className="animate-modal-pop"
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "380px",
          padding: "1.25rem",
          boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Header */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Crop size={18} color="var(--teal)" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              ครอบตัดรูปภาพ (1:1)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "0.2rem",
              borderRadius: "0.5rem",
              color: "var(--ink-soft)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1:1 Crop Viewport */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            position: "relative",
            width: `${containerSize}px`,
            height: `${containerSize}px`,
            borderRadius: "1rem",
            overflow: "hidden",
            backgroundColor: "#1e293b",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            touchAction: "none",
            boxShadow: "inset 0 0 0 2px var(--teal)",
          }}
        >
          {/* Draggable & Zoomable Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Crop target"
            onLoad={onImageLoad}
            draggable={false}
            style={{
              position: "absolute",
              left: `${containerSize / 2 + position.x}px`,
              top: `${containerSize / 2 + position.y}px`,
              width: `${displayedWidth}px`,
              height: `${displayedHeight}px`,
              transform: "translate(-50%, -50%)",
              maxWidth: "none",
              maxHeight: "none",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />

          {/* Grid overlay for visual guide */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "1fr 1fr 1fr",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <div style={{ borderRight: "1px dashed rgba(255, 255, 255, 0.25)", borderBottom: "1px dashed rgba(255, 255, 255, 0.25)" }} />
            <div style={{ borderRight: "1px dashed rgba(255, 255, 255, 0.25)", borderBottom: "1px dashed rgba(255, 255, 255, 0.25)" }} />
            <div style={{ borderBottom: "1px dashed rgba(255, 255, 255, 0.25)" }} />
            <div style={{ borderRight: "1px dashed rgba(255, 255, 255, 0.25)", borderBottom: "1px dashed rgba(255, 255, 255, 0.25)" }} />
            <div style={{ borderRight: "1px dashed rgba(255, 255, 255, 0.25)", borderBottom: "1px dashed rgba(255, 255, 255, 0.25)" }} />
            <div style={{ borderBottom: "1px dashed rgba(255, 255, 255, 0.25)" }} />
            <div style={{ borderRight: "1px dashed rgba(255, 255, 255, 0.25)" }} />
            <div style={{ borderRight: "1px dashed rgba(255, 255, 255, 0.25)" }} />
            <div />
          </div>
        </div>

        {/* Tip text */}
        <p style={{ fontSize: "0.725rem", color: "var(--ink-soft)", marginTop: "0.5rem" }}>
          ลากเพื่อปรับตำแหน่ง หรือใช้แถบด้านล่างเพื่อซูม
        </p>

        {/* Zoom Controls */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.6rem" }}>
          <ZoomOut size={16} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: "var(--teal)",
              cursor: "pointer",
            }}
          />
          <ZoomIn size={16} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            title="รีเซ็ต"
            style={{
              background: "transparent",
              border: "1px solid rgba(50,55,65,0.15)",
              borderRadius: "0.4rem",
              padding: "0.25rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-soft)",
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "0.55rem",
              border: "1px solid rgba(50, 55, 65, 0.15)",
              backgroundColor: "transparent",
              color: "var(--ink)",
              cursor: "pointer",
              fontFamily: "'Kanit', sans-serif",
              fontSize: "0.825rem",
              fontWeight: 500,
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 1.25rem",
              borderRadius: "0.55rem",
              border: "none",
              backgroundColor: "var(--teal)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "'Kanit', sans-serif",
              fontSize: "0.825rem",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(75, 155, 140, 0.25)",
            }}
          >
            <Check size={16} />
            <span>ใช้รูปนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
}
