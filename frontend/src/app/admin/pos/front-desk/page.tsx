"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import CartDrawer, { CartItemModel } from "@/components/layouts/CartDrawer";
import OrderProductModal, { OrderItemResult } from "@/components/ui/modals/OrderProductModal";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  X,
  RotateCcw,
  Flame,
  Award,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface Product {
  id: number;
  name_th: string;
  name_en: string;
  desc: string;
  price_hot: number | null;
  price_iced: number | null;
  category: "flavours" | "combos";
  image: string;
  is_available: boolean;
  is_sold_out: boolean;
  is_recommended: boolean;
  sort_order: number;
  default_toppings?: string[];
}

interface Topping {
  id: number;
  name_th: string;
  name_en: string;
  price: number;
  allow_hot: boolean;
  allow_iced: boolean;
  is_available: boolean;
  is_sold_out: boolean;
}

interface CartItem {
  cart_item_id: string;
  product: Product;
  temperature: "iced" | "hot";
  sweetness: "0%" | "25%" | "50%" | "75%" | "100%";
  toppings: Topping[];
  quantity: number;
  unit_price: number;
  total_price: number;
  note: string;
}

export default function POSFrontDeskPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<"all" | "flavours" | "combos">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Item Customizer Modal State
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  const CART_STORAGE_KEY = "kaset_pos_cart";

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever cart changes (only after initial load)
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart, isCartLoaded]);

  // Helper to get image URL
  const getFullImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      return `${apiUrl}${url}`;
    }
    return url;
  };

  // Fetch real products and toppings from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

      // Fetch available products
      const resProducts = await fetch(`${apiUrl}/api/v1/products?page_size=100&status=available`);
      if (resProducts.ok) {
        const prodData = await resProducts.json();
        const mappedProducts: Product[] = (prodData.data || []).map((p: any) => {
          const comboToppingNames = (p.combo_recipes || [])
            .map((r: any) => r.topping?.name_th)
            .filter(Boolean);

          return {
            id: p.id,
            name_th: p.name_th,
            name_en: p.name_en || "",
            desc: p.desc_th || "",
            price_hot: p.price_hot,
            price_iced: p.price_iced,
            category: p.is_combo ? "combos" : "flavours",
            image: getFullImageUrl(p.image_url),
            is_available: p.is_available,
            is_sold_out: p.is_sold_out,
            is_recommended: p.is_recommended,
            sort_order: p.sort_order || 0,
            default_toppings: comboToppingNames,
          };
        });
        setProducts(mappedProducts);
      }

      // Fetch available toppings
      const resToppings = await fetch(`${apiUrl}/api/v1/toppings?page_size=100&status=available`);
      if (resToppings.ok) {
        const topData = await resToppings.json();
        const mappedToppings: Topping[] = (topData.data || []).map((t: any) => ({
          id: t.id,
          name_th: t.name_th,
          name_en: t.name_en || "",
          price: t.price || 0,
          allow_hot: Boolean(t.allow_hot),
          allow_iced: Boolean(t.allow_iced),
          is_available: Boolean(t.is_available),
          is_sold_out: Boolean(t.is_sold_out),
        }));
        setToppings(mappedToppings);
      }
    } catch (err) {
      console.error("Error fetching POS data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter products by selected category
  const filteredProducts = products
    .filter((p) => {
      if (selectedCategory === "flavours") return p.category === "flavours";
      if (selectedCategory === "combos") return p.category === "combos";
      return true;
    })
    .sort((a, b) => {
      if (a.is_recommended !== b.is_recommended) {
        return a.is_recommended ? -1 : 1;
      }
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

  // Helper to get base price of product based on chosen temperature
  const getProductPrice = (product: Product, temp: "iced" | "hot") => {
    if (temp === "hot") {
      return product.price_hot !== null && product.price_hot !== undefined ? product.price_hot : (product.price_iced || 0);
    }
    return product.price_iced !== null && product.price_iced !== undefined ? product.price_iced : (product.price_hot || 0);
  };

  // Open Customizer
  const handleOpenCustomizer = (product: Product) => {
    setEditingCartItem(null);
    setCustomizingProduct(product);
  };

  // Edit an existing Cart Item
  const handleEditCartItem = (item: CartItemModel) => {
    const found = cart.find((c) => c.cart_item_id === item.cartId);
    if (found) {
      setEditingCartItem(found);
      setCustomizingProduct(found.product);
    }
  };

  // Delete an existing Cart Item
  const handleDeleteCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cart_item_id !== cartItemId));
  };

  // Helper to generate a unique signature for item options (to detect identical items)
  const getItemSignature = (
    productId: number,
    temp: "iced" | "hot",
    sweet: string,
    tops: { id: string | number }[],
    itemNote?: string
  ) => {
    const topKey = (tops || []).map((t) => String(t.id)).sort().join(",");
    const cleanNote = (itemNote || "").trim();
    return `${productId}|${temp}|${sweet}|${topKey}|${cleanNote}`;
  };

  // Add customized item from OrderProductModal to cart or update existing
  const handleAddToCart = (result: OrderItemResult, editCartId?: string) => {
    const targetSig = getItemSignature(
      result.product.id,
      result.temperature,
      result.sweetness,
      result.toppings,
      result.note
    );

    if (editCartId) {
      setCart((prev) => {
        // Check if another item in cart has the exact same configuration
        const duplicateIndex = prev.findIndex(
          (c) =>
            c.cart_item_id !== editCartId &&
            getItemSignature(c.product.id, c.temperature, c.sweetness, c.toppings, c.note) === targetSig
        );

        if (duplicateIndex !== -1) {
          // Merge this item into the duplicate item and remove the old item
          return prev
            .filter((c) => c.cart_item_id !== editCartId)
            .map((c) => {
              if (getItemSignature(c.product.id, c.temperature, c.sweetness, c.toppings, c.note) === targetSig) {
                const mergedQty = c.quantity + result.quantity;
                return {
                  ...c,
                  quantity: mergedQty,
                  unit_price: result.unitPrice,
                  total_price: result.unitPrice * mergedQty,
                };
              }
              return c;
            });
        }

        // Otherwise update in place
        return prev.map((c) => {
          if (c.cart_item_id === editCartId) {
            return {
              ...c,
              temperature: result.temperature,
              sweetness: result.sweetness,
              toppings: result.toppings as Topping[],
              quantity: result.quantity,
              unit_price: result.unitPrice,
              total_price: result.totalPrice,
              note: result.note.trim(),
            };
          }
          return c;
        });
      });
    } else {
      setCart((prev) => {
        // Check if identical item already exists in cart
        const existingIndex = prev.findIndex(
          (c) => getItemSignature(c.product.id, c.temperature, c.sweetness, c.toppings, c.note) === targetSig
        );

        if (existingIndex !== -1) {
          // Merge by adding quantity
          const updated = [...prev];
          const existing = updated[existingIndex];
          const newQty = existing.quantity + result.quantity;
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            unit_price: result.unitPrice,
            total_price: result.unitPrice * newQty,
          };
          return updated;
        }

        // Add as a new line item
        const newItem: CartItem = {
          cart_item_id: `${result.product.id}-${result.temperature}-${result.sweetness}-${(result.toppings || []).map((t) => t.id).sort().join(",")}-${Date.now()}`,
          product: result.product as Product,
          temperature: result.temperature,
          sweetness: result.sweetness,
          toppings: result.toppings as Topping[],
          quantity: result.quantity,
          unit_price: result.unitPrice,
          total_price: result.totalPrice,
          note: result.note.trim(),
        };
        return [...prev, newItem];
      });
    }

    setCustomizingProduct(null);
    setEditingCartItem(null);
  };

  // Update Cart Quantity
  const handleUpdateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cart_item_id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total_price: item.unit_price * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)" }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: "1.75rem 1rem", paddingBottom: "6rem", overflowY: "auto", minWidth: 0 }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", width: "100%" }}>
          {/* Header Section */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                รายการเมนูเครื่องดื่ม
              </h1>
            </div>
          </div>

          {/* Menu Section */}
          <section id="menu" style={{ marginTop: "1.25rem" }}>
            {/* Category Tabs */}
            <div
              style={{
                marginTop: "0.85rem",
                display: "flex",
                gap: "0.5rem",
                borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
                paddingBottom: "0.6rem",
                overflowX: "auto",
              }}
            >
              {[
                { id: "all", label: "ทั้งหมด" },
                { id: "flavours", label: "รสชาติหลัก" },
                { id: "combos", label: "เมนูคอมโบ" },
              ].map((tab) => {
                const isSelected = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id as any)}
                    style={{
                      borderRadius: "9999px",
                      padding: "0.45rem 1rem",
                      fontSize: "0.825rem",
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: "'Kanit', sans-serif",
                      cursor: "pointer",
                      border: isSelected ? "none" : "1px solid rgba(50, 55, 65, 0.1)",
                      backgroundColor: isSelected ? "var(--ink)" : "var(--card)",
                      color: isSelected ? "var(--cream)" : "var(--ink-soft)",
                      boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Products Grid */}
            <div style={{ marginTop: "1rem" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 0", color: "var(--teal)", gap: "0.5rem" }}>
                  <Loader2 size={24} className="animate-spin" />
                  <span>กำลังโหลดเมนูสินค้า...</span>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "0.85rem",
                  }}
                >
                  {filteredProducts.map((p, idx) => (
                    <article
                      key={p.id}
                      onClick={() => !p.is_sold_out && handleOpenCustomizer(p)}
                      className="animate-rise"
                      style={{
                        animationDelay: `${50 + idx * 35}ms`,
                        overflow: "hidden",
                        borderRadius: "1.25rem",
                        backgroundColor: "var(--card)",
                        border: "1px solid rgba(50, 55, 65, 0.1)",
                        display: "flex",
                        flexDirection: "column",
                        cursor: p.is_sold_out ? "not-allowed" : "pointer",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        opacity: p.is_sold_out ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!p.is_sold_out) {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0,0,0,0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Product Image */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "1/1",
                          backgroundColor: "rgba(50, 55, 65, 0.05)",
                        }}
                      >
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name_th}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                            priority={idx < 4}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ImageIcon size={32} color="var(--ink-soft)" opacity={0.3} />
                          </div>
                        )}

                        {p.is_recommended && (
                          <span
                            style={{
                              position: "absolute",
                              left: "0.5rem",
                              top: "0.5rem",
                              borderRadius: "9999px",
                              backgroundColor: "var(--warm)",
                              padding: "0.2rem 0.6rem",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "var(--ink)",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                            }}
                          >
                            แนะนำ
                          </span>
                        )}

                        {p.category === "combos" && (
                          <span
                            style={{
                              position: "absolute",
                              right: "0.5rem",
                              top: "0.5rem",
                              borderRadius: "9999px",
                              backgroundColor: "var(--teal)",
                              padding: "0.2rem 0.5rem",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "var(--cream)",
                            }}
                          >
                            COMBO
                          </span>
                        )}

                        {p.is_sold_out && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              backgroundColor: "rgba(0,0,0,0.5)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                            }}
                          >
                            สินค้าหมด
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                        <div>
                          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>
                            {p.name_th}
                          </h3>
                          {p.name_en && (
                            <p className="font-mono" style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                              {p.name_en}
                            </p>
                          )}
                          {p.desc && (
                            <p
                              style={{
                                marginTop: "0.35rem",
                                fontSize: "0.75rem",
                                color: "var(--ink-soft)",
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {p.desc}
                            </p>
                          )}
                        </div>

                        <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>เริ่มต้น </span>
                            <span className="font-display" style={{ fontSize: "1.25rem", color: "var(--ink)" }}>
                              {p.price_iced ?? p.price_hot ?? 0}฿
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={p.is_sold_out}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomizer(p);
                            }}
                            style={{
                              borderRadius: "9999px",
                              backgroundColor: p.is_sold_out ? "#e5e7eb" : "var(--ink)",
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: p.is_sold_out ? "#9ca3af" : "var(--cream)",
                              border: "none",
                              cursor: p.is_sold_out ? "not-allowed" : "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            เลือก +
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Toppings Showcase Section (matches page.tsx style) */}
          {toppings.length > 0 && (
            <section id="toppings" style={{ marginTop: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--ink)" }}>ท็อปปิ้ง (Toppings)</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "0.15rem" }}>
                    เพิ่มความอร่อยให้เครื่องดื่มของคุณ
                  </p>
                </div>
              </div>

              <div
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3"
                style={{ marginTop: "0.85rem" }}
              >
                {toppings.map((topping) => (
                  <div
                    key={topping.id}
                    style={{
                      borderRadius: "1rem",
                      backgroundColor: "var(--card)",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      padding: "0.85rem 0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: "85px",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>
                        {topping.name_th}
                      </p>
                      {topping.allow_iced && !topping.allow_hot && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "0.25rem",
                            fontSize: "9px",
                            color: "var(--teal)",
                            fontWeight: 600,
                            backgroundColor: "rgba(75, 155, 140, 0.15)",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "4px",
                          }}
                        >
                          เฉพาะเมนูเย็น
                        </span>
                      )}
                    </div>
                    <p
                      className="font-display"
                      style={{ marginTop: "0.4rem", fontSize: "1.15rem", color: "var(--teal)", lineHeight: 1 }}
                    >
                      +{topping.price}฿
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Floating Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="ตะกร้าสินค้า"
            style={{
              position: "fixed",
              bottom: "2rem",
              right: "2.5rem",
              zIndex: 40,
              width: "4rem",
              height: "4rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "9999px",
              backgroundColor: "var(--ink)",
              color: "var(--cream)",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <ShoppingBag size={24} />
            {totalCups > 0 && (
              <span
                style={{
                  position: "absolute",
                  right: "-0.2rem",
                  top: "-0.2rem",
                  minWidth: "1.6rem",
                  height: "1.6rem",
                  padding: "0 0.3rem",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "9999px",
                  backgroundColor: "var(--warm)",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color: "var(--ink)",
                  border: "2px solid var(--cream)",
                }}
              >
                {totalCups}
              </span>
            )}
          </button>

          {/* Cart Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart.map((c) => ({
              cartId: c.cart_item_id,
              productId: c.product.id,
              productName: c.product.name_th,
              temperature: c.temperature,
              sweetness: c.sweetness,
              toppings: c.toppings.map((t) => ({ id: t.id, name: t.name_th, price: t.price })),
              unitPrice: c.unit_price,
              quantity: c.quantity,
              note: c.note,
            }))}
            onUpdateQty={handleUpdateCartQty}
            onDeleteItem={handleDeleteCartItem}
            onEditItem={handleEditCartItem}
            onCheckout={() => {
              setIsCartOpen(false);
              router.push("/admin/pos/payment");
            }}
            title="ตะกร้าเครื่องดื่ม (Walk-in)"
            subtitle={`ทั้งหมด ${totalCups} แก้ว`}
            checkoutButtonText="ชำระเงิน"
          />

          {/* Item Customizer Modal */}
          <OrderProductModal
            isOpen={!!customizingProduct}
            onClose={() => {
              setCustomizingProduct(null);
              setEditingCartItem(null);
            }}
            product={customizingProduct}
            toppings={toppings}
            initialValues={
              editingCartItem
                ? {
                  cartId: editingCartItem.cart_item_id,
                  temperature: editingCartItem.temperature,
                  sweetness: editingCartItem.sweetness,
                  toppings: editingCartItem.toppings,
                  quantity: editingCartItem.quantity,
                  note: editingCartItem.note,
                }
                : null
            }
            onAddToCart={handleAddToCart}
          />
        </div>
      </main>
    </div>
  );
}
