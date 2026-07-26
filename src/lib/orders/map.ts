import { Order } from "@/types/order";

/** Converts a snake_case Supabase row into our camelCase Order type. */
export function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    employee: row.employee as string | null,
    brand: row.brand as string | null,
    marketplace: row.marketplace as Order["marketplace"],
    platformOrderNumber: row.platform_order_number as string | null,
    orderDate: row.order_date as string,

    buyerName: row.buyer_name as string | null,
    shippingAddress: row.shipping_address as string | null,
    addressLine: row.address_line as string | null,
    city: row.city as string | null,
    state: row.state as string | null,
    zip: row.zip as string | null,
    country: row.country as string | null,
    contactNo: row.contact_no as string | null,

    category: row.category as string | null,
    sku: row.sku as string | null,
    imagePath: row.image_path as string | null,
    metalKt: row.metal_kt as Order["metalKt"],
    metalColor: row.metal_color as Order["metalColor"],
    stoneQuality: row.stone_quality as Order["stoneQuality"],
    size: row.size as string | null,
    quantity: row.quantity as number,
    weight: row.weight as number | null,
    finalWeight: row.final_weight as number | null,
    remark: row.remark as string | null,

    soldPrice: row.sold_price as number | null,
    materialCost: row.material_cost as number | null,

    priority: row.priority as Order["priority"],
    shipBy: row.ship_by as string | null,
    stage: row.stage as Order["stage"],
    stageTimestamps: (row.stage_timestamps as Order["stageTimestamps"]) ?? {},
    cancelled: row.cancelled as boolean,
    productionNotes: row.production_notes as string | null,

    returned: row.returned as boolean,
    returnReason: row.return_reason as string | null,
    returnDate: row.return_date as string | null,
    refundType: row.refund_type as Order["refundType"],
    refundAmount: row.refund_amount as number | null,
    refundDate: row.refund_date as string | null,

    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Converts a partial camelCase order payload (from the client) into snake_case DB columns. */
export function orderToRow(order: Partial<Order>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const map: Record<string, string> = {
    employee: "employee",
    brand: "brand",
    marketplace: "marketplace",
    platformOrderNumber: "platform_order_number",
    orderDate: "order_date",
    buyerName: "buyer_name",
    shippingAddress: "shipping_address",
    addressLine: "address_line",
    city: "city",
    state: "state",
    zip: "zip",
    country: "country",
    contactNo: "contact_no",
    category: "category",
    sku: "sku",
    imagePath: "image_path",
    metalKt: "metal_kt",
    metalColor: "metal_color",
    stoneQuality: "stone_quality",
    size: "size",
    quantity: "quantity",
    weight: "weight",
    finalWeight: "final_weight",
    remark: "remark",
    soldPrice: "sold_price",
    materialCost: "material_cost",
    priority: "priority",
    shipBy: "ship_by",
    stage: "stage",
    stageTimestamps: "stage_timestamps",
    cancelled: "cancelled",
    productionNotes: "production_notes",
    returned: "returned",
    returnReason: "return_reason",
    returnDate: "return_date",
    refundType: "refund_type",
    refundAmount: "refund_amount",
    refundDate: "refund_date",
  };

  for (const [camel, snake] of Object.entries(map)) {
    if (camel in order) {
      row[snake] = (order as Record<string, unknown>)[camel];
    }
  }
  return row;
}
