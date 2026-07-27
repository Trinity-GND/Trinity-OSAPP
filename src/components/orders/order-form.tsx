"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { parseShippingAddress } from "@/lib/address-parser";
import { Order } from "@/types/order";
import ImageUpload from "./image-upload";

const MARKETPLACES = ["Etsy", "Amazon", "Shopify", "Walmart", "eBay", "Instagram-DM", "Other"];
const METAL_KTS = ["Sterling Silver", "9KT", "10KT", "14KT", "18KT"];
const METAL_COLORS = ["White", "Rose", "Yellow"];
const STONE_QUALITIES = ["Cubic Zirconia", "Moissanite", "Lab Grown", "Natural"];
const PRIORITIES = ["Normal", "High", "Urgent"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function OrderForm({
  role,
  defaultEmployee,
  mode = "create",
  orderId,
  initialOrder,
  onSaved,
}: {
  role: "owner" | "employee";
  defaultEmployee: string;
  mode?: "create" | "edit";
  orderId?: string;
  initialOrder?: Order;
  onSaved?: (order: Order) => void;
}) {
  const router = useRouter();

  const [employee, setEmployee] = useState(initialOrder?.employee ?? defaultEmployee);
  const [brand, setBrand] = useState(initialOrder?.brand ?? "");
  const [marketplace, setMarketplace] = useState<string>(initialOrder?.marketplace ?? "Etsy");
  const [platformOrderNumber, setPlatformOrderNumber] = useState(initialOrder?.platformOrderNumber ?? "");
  const [orderDate, setOrderDate] = useState(initialOrder?.orderDate ?? todayISO());

  const [buyerName, setBuyerName] = useState(initialOrder?.buyerName ?? "");
  const [buyerNameTouched, setBuyerNameTouched] = useState(mode === "edit");
  const [shippingAddress, setShippingAddress] = useState(initialOrder?.shippingAddress ?? "");

  const [category, setCategory] = useState(initialOrder?.category ?? "");
  const [sku, setSku] = useState(initialOrder?.sku ?? "");
  const [imagePath, setImagePath] = useState<string | null>(initialOrder?.imagePath ?? null);
  const [metalKt, setMetalKt] = useState<string>(initialOrder?.metalKt ?? "14KT");
  const [metalColor, setMetalColor] = useState<string>(initialOrder?.metalColor ?? "Yellow");
  const [stoneQuality, setStoneQuality] = useState<string>(initialOrder?.stoneQuality ?? "Moissanite");
  const [size, setSize] = useState(initialOrder?.size ?? "");
  const [quantity, setQuantity] = useState(String(initialOrder?.quantity ?? 1));
  const [weight, setWeight] = useState(initialOrder?.weight != null ? String(initialOrder.weight) : "");
  const [remark, setRemark] = useState(initialOrder?.remark ?? "");

  const [soldPrice, setSoldPrice] = useState(
    initialOrder?.soldPrice != null ? String(initialOrder.soldPrice) : "",
  );
  const [materialCost, setMaterialCost] = useState(
    initialOrder?.materialCost != null ? String(initialOrder.materialCost) : "",
  );

  const [priority, setPriority] = useState<string>(initialOrder?.priority ?? "Normal");
  const [shipBy, setShipBy] = useState(initialOrder?.shipBy ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const parsedPreview = useMemo(
    () => (shippingAddress.trim() ? parseShippingAddress(shippingAddress) : null),
    [shippingAddress],
  );

  function handleAddressChange(value: string) {
    setShippingAddress(value);
    if (!buyerNameTouched) {
      const parsed = parseShippingAddress(value);
      if (parsed.buyerNameSuggestion) setBuyerName(parsed.buyerNameSuggestion);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setSaved(false);

    const payload: Record<string, unknown> = {
      employee,
      brand,
      marketplace,
      platformOrderNumber,
      orderDate,
      buyerName,
      shippingAddress,
      category,
      sku,
      imagePath,
      metalKt,
      metalColor,
      stoneQuality,
      size,
      quantity: Number(quantity) || 1,
      weight: weight ? Number(weight) : null,
      remark,
      soldPrice: soldPrice ? Number(soldPrice) : null,
      priority,
      shipBy: shipBy || null,
    };
    if (role === "owner") {
      payload.materialCost = materialCost ? Number(materialCost) : null;
    }

    try {
      const url = mode === "edit" ? `/api/orders/${orderId}` : "/api/orders";
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to save order");

      if (mode === "edit") {
        setSaved(true);
        onSaved?.(body.order);
        router.refresh();
      } else {
        router.push(`/orders/${body.order.id}`);
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-3xl mx-auto m-4 sm:m-6 p-6 space-y-8 bg-card border border-border-warm rounded-lg"
    >
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted uppercase tracking-wide">Order Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee">
            <input className="input" value={employee} onChange={(e) => setEmployee(e.target.value)} />
          </Field>
          <Field label="Brand">
            <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <Field label="Marketplace">
            <select className="input" value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
              {MARKETPLACES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Platform Order #">
            <input
              className="input"
              value={platformOrderNumber}
              onChange={(e) => setPlatformOrderNumber(e.target.value)}
            />
          </Field>
          <Field label="Order Date">
            <input
              type="date"
              className="input"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted uppercase tracking-wide">Buyer Info</h2>
        <Field label="Shipping Address (paste the entire block from the marketplace)">
          <textarea
            className="input"
            rows={5}
            value={shippingAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder={"Rosa Dieguez\n14458 SW 18TH ST.\nMiami, FL 33175\nUnited States\n3055281710"}
          />
        </Field>
        {parsedPreview && (
          <p className="text-xs text-muted">
            Parsed: {parsedPreview.addressLine ?? "—"}, {parsedPreview.city ?? "—"},{" "}
            {parsedPreview.state ?? "—"} {parsedPreview.zip ?? ""} · {parsedPreview.country ?? "—"} ·{" "}
            {parsedPreview.contactNo ?? "—"}
          </p>
        )}
        <Field label="Buyer Name">
          <input
            className="input"
            value={buyerName}
            onChange={(e) => {
              setBuyerName(e.target.value);
              setBuyerNameTouched(true);
            }}
          />
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted uppercase tracking-wide">Product Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="SKU">
            <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} />
          </Field>
        </div>
        <Field label="Product Photo">
          <ImageUpload value={imagePath} onChange={setImagePath} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Metal / KT">
            <select className="input" value={metalKt} onChange={(e) => setMetalKt(e.target.value)}>
              {METAL_KTS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Metal Color">
            <select className="input" value={metalColor} onChange={(e) => setMetalColor(e.target.value)}>
              {METAL_COLORS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stone Quality">
            <select className="input" value={stoneQuality} onChange={(e) => setStoneQuality(e.target.value)}>
              {STONE_QUALITIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Size">
            <input className="input" value={size} onChange={(e) => setSize(e.target.value)} />
          </Field>
          <Field label="Quantity">
            <input
              type="number"
              min={1}
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field label="Weight (grams, estimate)">
            <input
              type="number"
              step="0.01"
              className="input"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Remark">
          <textarea className="input" rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted uppercase tracking-wide">Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sold Price (USD)">
            <input
              type="number"
              step="0.01"
              className="input"
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
            />
          </Field>
          {role === "owner" && (
            <Field label="Material Cost (USD)">
              <input
                type="number"
                step="0.01"
                className="input"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
              />
            </Field>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted uppercase tracking-wide">Production</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ship By">
            <input type="date" className="input" value={shipBy} onChange={(e) => setShipBy(e.target.value)} />
          </Field>
        </div>
      </section>

      {error && <p className="text-danger text-sm">{error}</p>}
      {saved && !error && <p className="text-success text-sm">Saved.</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-md bg-gold text-navy text-sm font-medium hover:bg-gold-dark disabled:opacity-50"
        >
          {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Save Order"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--color-border-warm);
          background: var(--color-cream);
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-gold);
          box-shadow: 0 0 0 1px var(--color-gold);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
