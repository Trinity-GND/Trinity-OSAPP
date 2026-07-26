export type Marketplace =
  | "Etsy"
  | "Amazon"
  | "Shopify"
  | "Walmart"
  | "eBay"
  | "Instagram-DM"
  | "Other";

export type MetalKt = "Sterling Silver" | "9KT" | "10KT" | "14KT" | "18KT";
export type MetalColor = "White" | "Rose" | "Yellow";
export type StoneQuality = "Cubic Zirconia" | "Moissanite" | "Lab Grown" | "Natural";
export type Priority = "Normal" | "High" | "Urgent";
export type Stage = "cad" | "cam" | "casting" | "inProduction" | "readyToDispatch" | "dispatched";
export type RefundType = "none" | "full" | "partial";

export const STAGES: Stage[] = [
  "cad",
  "cam",
  "casting",
  "inProduction",
  "readyToDispatch",
  "dispatched",
];

export const STAGE_LABELS: Record<Stage, string> = {
  cad: "CAD",
  cam: "CAM",
  casting: "Casting",
  inProduction: "In Production",
  readyToDispatch: "Ready to Dispatch",
  dispatched: "Dispatched",
};

export type StageTimestamps = Partial<Record<Stage, string>>;

export type Order = {
  id: string;
  employee: string | null;
  brand: string | null;
  marketplace: Marketplace | null;
  platformOrderNumber: string | null;
  orderDate: string;

  buyerName: string | null;
  shippingAddress: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  contactNo: string | null;

  category: string | null;
  sku: string | null;
  imagePath: string | null;
  metalKt: MetalKt | null;
  metalColor: MetalColor | null;
  stoneQuality: StoneQuality | null;
  size: string | null;
  quantity: number;
  weight: number | null;
  finalWeight: number | null;
  remark: string | null;

  soldPrice: number | null;
  materialCost: number | null;

  priority: Priority;
  shipBy: string | null;
  stage: Stage | null;
  stageTimestamps: StageTimestamps;
  cancelled: boolean;
  productionNotes: string | null;

  returned: boolean;
  returnReason: string | null;
  returnDate: string | null;
  refundType: RefundType;
  refundAmount: number | null;
  refundDate: string | null;

  createdAt: string;
  updatedAt: string;
};

/** Fields an employee session must never receive, even inside the order detail. */
export const OWNER_ONLY_FIELDS = ["materialCost"] as const;
