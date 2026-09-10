"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Edit3, X, Upload, ImageIcon, Loader2, Star, Check, Trash2 } from "lucide-react";

export interface ToppingOption {
  id: number;
  nameTh: string;
  nameEn: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
  isSoldOut?: boolean;
}

export interface BaseProductOption {
  id: number;
  nameTh: string;
  nameEn: string;
}

interface AddEditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  mode: "create" | "edit";
  formNameTh: string;
  setFormNameTh: (v: string) => void;
  formNameEn: string;
  setFormNameEn: (v: string) => void;
  formCategory: "flavours" | "combos";
  setFormCategory: (v: "flavours" | "combos") => void;
  formPriceHot: number | string;
  setFormPriceHot: (v: number | string) => void;
  formPriceIced: number | string;
  setFormPriceIced: (v: number | string) => void;
  formSortOrder?: number;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formDescEn?: string;
  setFormDescEn?: (v: string) => void;
  formImageUrl: string;
  setFormImageUrl: (v: string) => void;
  formIsRecommended: boolean;
  setFormIsRecommended: (v: boolean) => void;
  formBaseProductId: number | "";
  setFormBaseProductId: (id: number | "") => void;
  selectedToppingIds: number[];
  setSelectedToppingIds: (ids: number[]) => void;
  formError: string | null;
  isSubmitting: boolean;
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: () => void;
}

export default function AddEditMenuModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  formNameTh,
  setFormNameTh,
  formNameEn,
  setFormNameEn,
  formCategory,
  setFormCategory,
  formPriceHot,
  setFormPriceHot,
  formPriceIced,
  setFormPriceIced,
  formSortOrder = 1,
  formDescription,
  setFormDescription,
  formDescEn = "",
  setFormDescEn,
  formImageUrl,
  setFormImageUrl,
  formIsRecommended,
  setFormIsRecommended,
  formBaseProductId,
  setFormBaseProductId,
  selectedToppingIds,
  setSelectedToppingIds,
  formError,
  isSubmitting,
  isUploading,
  onFileUpload,
  onRemoveImage,
}: AddEditMenuModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descThRef = useRef<HTMLTextAreaElement>(null);
  const descEnRef = useRef<HTMLTextAreaElement>(null);
  const isSyncingHeight = useRef<boolean>(false);
  const [availableToppings, setAvailableToppings] = useState<ToppingOption[]>([]);
  const [availableBaseProducts, setAvailableBaseProducts] = useState<BaseProductOption[]>([]);
  const [loadingToppings, setLoadingToppings] = useState<boolean>(false);

  // Sync heights of Thai and English textareas when user resizes either one
  useEffect(() => {
    if (!isOpen) return;

    const syncHeight = (source: HTMLTextAreaElement, target: HTMLTextAreaElement | null) => {
      if (!source || !target || isSyncingHeight.current) return;
      isSyncingHeight.current = true;
      target.style.height = `${source.offsetHeight}px`;
      requestAnimationFrame(() => {
        isSyncingHeight.current = false;
      });
    };

    let roTh: ResizeObserver | null = null;
    let roEn: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      if (descThRef.current) {
        roTh = new ResizeObserver(() => {
          if (descThRef.current && descEnRef.current) {
            syncHeight(descThRef.current, descEnRef.current);
          }
        });
        roTh.observe(descThRef.current);
      }

      if (descEnRef.current) {
        roEn = new ResizeObserver(() => {
          if (descEnRef.current && descThRef.current) {
            syncHeight(descEnRef.current, descThRef.current);
          }
        });
        roEn.observe(descEnRef.current);
      }
    }

    return () => {
      roTh?.disconnect();
      roEn?.disconnect();
    };
  }, [isOpen]);

  // Fetch available toppings & base flavour products when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoadingToppings(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
        
        // Fetch Toppings
        const resTop = await fetch(`${apiUrl}/api/v1/toppings?page_size=100`);
        if (resTop.ok) {
          const data = await resTop.json();
          if (isMounted && data.data) {
            setAvailableToppings(
              data.data.map((t: any) => ({
                id: t.id,
                nameTh: t.name_th,
                nameEn: t.name_en || "",
                price: t.price || 0,
                image: t.image_url || "/images/drink-pearl.jpg",
                isAvailable: t.is_available,
                isSoldOut: t.is_sold_out,
              }))
            );
          }
        }

        // Fetch Flavours Products (Base Drinks)
        const resProd = await fetch(`${apiUrl}/api/v1/products?category=flavours&page_size=100`);
        if (resProd.ok) {
          const prodData = await resProd.json();
          if (isMounted && prodData.data) {
            setAvailableBaseProducts(
              prodData.data.map((p: any) => ({
                id: p.id,
                nameTh: p.name_th,
                nameEn: p.name_en || "",
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch toppings/base products", err);
      } finally {
        if (isMounted) setLoadingToppings(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to format image URL (returns empty string if url is empty)
  const getFullImageUrl = (url: string) => {
    if (!url || !url.trim()) return "";
    if (url.startsWith("blob:") || url.startsWith("data:")) return url;
    if (url.startsWith("/uploads/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      return `${apiUrl}${url}`;
    }
    return url;
  };

  // Toggle Topping Selection & Auto-update Category
  const handleToggleTopping = (toppingId: number) => {
    const isSelected = selectedToppingIds.includes(toppingId);
    let nextIds: number[];
    if (isSelected) {
      nextIds = selectedToppingIds.filter((id) => id !== toppingId);
    } else {
      nextIds = [...selectedToppingIds, toppingId];
    }
    setSelectedToppingIds(nextIds);

    // Auto switch category: if has toppings => combos, else => flavours
    if (nextIds.length > 0) {
      setFormCategory("combos");
    } else {
      setFormCategory("flavours");
    }
  };

  const currentDisplayImage = getFullImageUrl(formImageUrl);

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "0.75rem",
      }}
    >
      <div
        className="animate-modal-pop"
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "540px",
          padding: "1.25rem 1.5rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid rgba(50, 55, 65, 0.1)",
        }}
      >
        {/* Header: Title and Close Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem", margin: 0 }}>
            <Edit3 size={18} color="var(--teal)" />
            {mode === "create" ? "เพิ่มเมนูใหม่" : "แก้ไขข้อมูลเมนู"}
          </h3>
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

        {formError && (
          <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", backgroundColor: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)", borderRadius: "0.5rem", color: "#dc2626", fontSize: "0.8rem" }}>
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
            style={{ display: "none" }}
          />

          {/* Top Section: Image Box (~40%) on the left, Order (Readonly) & Price on the right */}
          <div style={{ display: "grid", gridTemplateColumns: "4fr 6fr", gap: "0.85rem", alignItems: "stretch", marginBottom: "0.2rem" }}>
            {/* Clickable 1:1 Square Image Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: "0.85rem",
                overflow: "hidden",
                backgroundColor: "#f2eee4",
                border: "1.5px dashed rgba(50, 55, 65, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isUploading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {currentDisplayImage ? (
                <>
                  <Image
                    src={currentDisplayImage}
                    alt="Menu preview"
                    fill
                    unoptimized={currentDisplayImage.startsWith("http") || currentDisplayImage.startsWith("blob:") || currentDisplayImage.startsWith("data:")}
                    style={{ objectFit: "cover" }}
                  />
                  {/* Hover overlay to indicate clickable */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.35)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      opacity: 0.9,
                      transition: "opacity 0.2s ease",
                      padding: "0.25rem",
                      textAlign: "center",
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>กำลังอัปโหลด...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>คลิกเพื่อเปลี่ยนรูป</span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", color: "var(--ink-soft)", padding: "0.5rem", textAlign: "center" }}>
                  {isUploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" color="var(--teal)" />
                      <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>กำลังอัปโหลด...</span>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "var(--cream)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(50, 55, 65, 0.1)",
                        }}
                      >
                        <ImageIcon size={16} color="var(--teal)" />
                      </div>
                      <span style={{ fontSize: "0.725rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
                        กดเพื่ออัปโหลดรูปภาพ
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Delete / Remove Image Button in Top-Left corner */}
              {currentDisplayImage && onRemoveImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage();
                  }}
                  title="ลบรูปภาพนี้"
                  style={{
                    position: "absolute",
                    top: "5px",
                    left: "5px",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(4px)",
                    border: "1.5px solid rgba(220, 38, 38, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                    transition: "all 0.15s ease",
                    padding: 0,
                    zIndex: 3,
                    color: "#dc2626",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}

              {/* Star / Recommended Toggle Button in Top-Right corner */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFormIsRecommended(!formIsRecommended);
                }}
                title={formIsRecommended ? "เมนูแนะนำ (คลิกเพื่อยกเลิก)" : "คลิกเพื่อตั้งเป็นเมนูแนะนำ"}
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: formIsRecommended ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(4px)",
                  border: formIsRecommended ? "1.5px solid #f59e0b" : "1.5px solid rgba(50, 55, 65, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                  transition: "all 0.15s ease",
                  padding: 0,
                  zIndex: 3,
                }}
              >
                <Star
                  size={14}
                  color={formIsRecommended ? "#f59e0b" : "#94a3b8"}
                  fill={formIsRecommended ? "#f59e0b" : "none"}
                />
              </button>
            </div>

            {/* Right of image: Order (readonly, top) and Price (bottom) */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", gap: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.65rem",
                  backgroundColor: "rgba(75, 155, 140, 0.08)",
                  border: "1px dashed rgba(75, 155, 140, 0.3)",
                  flex: 1,
                  minHeight: "48px",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(2.2rem, 5.5vw, 3.5rem)",
                    fontWeight: 900,
                    color: "var(--teal)",
                    fontFamily: "'Kanit', sans-serif",
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  #{formSortOrder}
                </span>
              </div>

              {/* Price inputs: Hot & Iced in 2 columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.15rem", color: "var(--ink)" }}>
                    ราคาร้อน (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="เช่น 35"
                    value={formPriceHot}
                    onChange={(e) => setFormPriceHot(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.55rem",
                      borderRadius: "0.55rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--cream)",
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "0.825rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.15rem", color: "var(--ink)" }}>
                    ราคาเย็น (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="เช่น 40"
                    value={formPriceIced}
                    onChange={(e) => setFormPriceIced(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.55rem",
                      borderRadius: "0.55rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--cream)",
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "0.825rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 1: Name TH (Full width) */}
          <div>
            <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.15rem" }}>
              ชื่อเมนู (ภาษาไทย) *
            </label>
            <input
              type="text"
              required
              placeholder=""
              value={formNameTh}
              onChange={(e) => setFormNameTh(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "0.55rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "var(--cream)",
                fontFamily: "'Kanit', sans-serif",
                fontSize: "0.825rem",
                outline: "none",
              }}
            />
          </div>

          {/* Row 2: Name EN (Full width) */}
          <div>
            <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.15rem" }}>
              ชื่อเมนู (English)
            </label>
            <input
              type="text"
              placeholder=""
              value={formNameEn}
              onChange={(e) => setFormNameEn(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "0.55rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "var(--cream)",
                fontFamily: "'Kanit', sans-serif",
                fontSize: "0.825rem",
                outline: "none",
              }}
            />
          </div>

          {/* Row 3 (2 Columns): Description TH & Description EN */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.15rem" }}>
                คำอธิบายภาษาไทย
              </label>
              <textarea
                ref={descThRef}
                rows={2}
                placeholder=""
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.4rem 0.65rem",
                  borderRadius: "0.55rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.8rem",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "50px",
                  maxHeight: "150px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.15rem" }}>
                คำอธิบายภาษาอังกฤษ (EN)
              </label>
              <textarea
                ref={descEnRef}
                rows={2}
                placeholder=""
                value={formDescEn}
                onChange={(e) => setFormDescEn && setFormDescEn(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.4rem 0.65rem",
                  borderRadius: "0.55rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.8rem",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "50px",
                  maxHeight: "150px",
                }}
              />
            </div>
          </div>

          {/* Divider Line & Combo Section Header */}
          <div
            style={{
              marginTop: "0.4rem",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              backgroundColor: (selectedToppingIds.length > 0 || formBaseProductId !== "") ? "rgba(75, 155, 140, 0.06)" : "rgba(50, 55, 65, 0.02)",
              border: (selectedToppingIds.length > 0 || formBaseProductId !== "") ? "1.5px solid rgba(75, 155, 140, 0.35)" : "1px dashed rgba(50, 55, 65, 0.18)",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.45rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 700, color: (selectedToppingIds.length > 0 || formBaseProductId !== "") ? "var(--teal)" : "var(--ink)", letterSpacing: "0.01em" }}>
                  ส่วนประกอบเซ็ตคอมโบ (Combo Set)
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {/* Dropdown 1: Base Drink */}
              <div>
                <label style={{ display: "block", fontSize: "0.725rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "0.25rem" }}>
                  เครื่องดื่มเบส (Base Drink):
                </label>
                <select
                  value={formBaseProductId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setFormBaseProductId("");
                      if (selectedToppingIds.length === 0) setFormCategory("flavours");
                    } else {
                      setFormBaseProductId(Number(val));
                      setFormCategory("combos");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "0.55rem",
                    border: formBaseProductId !== "" ? "1.5px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: "#fff",
                    fontFamily: "'Kanit', sans-serif",
                    fontSize: "0.825rem",
                    outline: "none",
                    cursor: "pointer",
                    color: "var(--ink)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <option value="">-- ไม่ระบุเครื่องดื่มเบส --</option>
                  {availableBaseProducts.map((base) => (
                    <option key={base.id} value={base.id}>
                      {base.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown 2: Included Topping */}
              <div>
                <label style={{ display: "block", fontSize: "0.725rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "0.25rem" }}>
                  ท็อปปิ้งในเซ็ต (Included Topping):
                </label>
                <select
                  value={selectedToppingIds[0] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setSelectedToppingIds([]);
                      if (formBaseProductId === "") setFormCategory("flavours");
                    } else {
                      setSelectedToppingIds([Number(val)]);
                      setFormCategory("combos");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "0.55rem",
                    border: selectedToppingIds.length > 0 ? "1.5px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: "#fff",
                    fontFamily: "'Kanit', sans-serif",
                    fontSize: "0.825rem",
                    outline: "none",
                    cursor: "pointer",
                    color: "var(--ink)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <option value="">-- ไม่ระบุท็อปปิ้ง --</option>
                  {availableToppings.map((top) => (
                    <option key={top.id} value={top.id}>
                      {top.nameTh} {top.price > 0 ? `(+฿${top.price})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p style={{ fontSize: "0.675rem", color: "var(--ink-soft)", margin: "0.35rem 0 0 0" }}>
              * หากระบุเครื่องดื่มเบสหรือท็อปปิ้ง ระบบจะจัดหมวดหมู่นี้เป็นเมนู <strong>"เซ็ตคอมโบ"</strong> และบันทึกสูตรให้อัตโนมัติ
            </p>
          </div>

          {/* Bottom Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.25rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.45rem 1.1rem",
                borderRadius: "0.55rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "transparent",
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "'Kanit', sans-serif",
                fontWeight: 500,
                fontSize: "0.825rem",
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 1.35rem",
                borderRadius: "0.55rem",
                border: "none",
                backgroundColor: "var(--teal)",
                color: "#fff",
                cursor: (isSubmitting || isUploading) ? "not-allowed" : "pointer",
                fontFamily: "'Kanit', sans-serif",
                fontWeight: 600,
                fontSize: "0.825rem",
                boxShadow: "0 2px 8px rgba(75, 155, 140, 0.25)",
              }}
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              <span>{mode === "create" ? "เพิ่มเมนู" : "บันทึกข้อมูล"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
