import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { Order } from "@/types/order";

const styles = StyleSheet.create({
  page: { padding: 16, fontSize: 7, fontFamily: "Helvetica" },
  title: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  table: { display: "flex", width: "100%" },
  row: { flexDirection: "row", borderBottom: "0.5pt solid #ccc" },
  headerRow: { flexDirection: "row", borderBottom: "1pt solid #000", fontWeight: 700, backgroundColor: "#f3f3f3" },
  cell: { padding: 3, borderRight: "0.5pt solid #ccc" },
  image: { width: 24, height: 24, objectFit: "cover" },
});

const COLS: { key: string; label: string; width: string }[] = [
  { key: "sr", label: "Sr.no", width: "3%" },
  { key: "shop", label: "Shop Name", width: "8%" },
  { key: "orderDate", label: "Order Date", width: "7%" },
  { key: "deliveryDate", label: "Delivery Date", width: "7%" },
  { key: "image", label: "Image", width: "6%" },
  { key: "metal", label: "METAL", width: "8%" },
  { key: "instructions", label: "Order Instructions", width: "14%" },
  { key: "size", label: "Size", width: "4%" },
  { key: "stone", label: "Stone Quality", width: "8%" },
  { key: "buyer", label: "Buyer name", width: "9%" },
  { key: "cad", label: "CAD", width: "6%" },
  { key: "casting", label: "Casting", width: "6%" },
  { key: "production", label: "Production", width: "6%" },
  { key: "rtd", label: "Ready for Dispatch", width: "7%" },
  { key: "remarks", label: "Remarks", width: "9%" },
];

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

export function OrdersReportDoc({ orders }: { orders: Order[] }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Trinity OS — Orders Report</Text>
        <View style={styles.table}>
          <View style={styles.headerRow} fixed>
            {COLS.map((c) => (
              <Text key={c.key} style={[styles.cell, { width: c.width }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {orders.map((o, idx) => (
            <View key={o.id} style={styles.row} wrap={false}>
              <Text style={[styles.cell, { width: COLS[0].width }]}>{idx + 1}</Text>
              <Text style={[styles.cell, { width: COLS[1].width }]}>{o.brand ?? "—"}</Text>
              <Text style={[styles.cell, { width: COLS[2].width }]}>{fmtDate(o.orderDate)}</Text>
              <Text style={[styles.cell, { width: COLS[3].width }]}>{fmtDate(o.shipBy)}</Text>
              <View style={[styles.cell, { width: COLS[4].width }]}>
                {o.imagePath && <Image style={styles.image} src={o.imagePath} />}
              </View>
              <Text style={[styles.cell, { width: COLS[5].width }]}>
                {[o.metalKt, o.metalColor].filter(Boolean).join(" ") || "—"}
              </Text>
              <Text style={[styles.cell, { width: COLS[6].width }]}>
                {[o.metalColor, o.remark].filter(Boolean).join(" — ") || "—"}
              </Text>
              <Text style={[styles.cell, { width: COLS[7].width }]}>{o.size ?? "—"}</Text>
              <Text style={[styles.cell, { width: COLS[8].width }]}>{o.stoneQuality ?? "—"}</Text>
              <Text style={[styles.cell, { width: COLS[9].width }]}>{o.buyerName ?? "—"}</Text>
              <Text style={[styles.cell, { width: COLS[10].width }]}>{fmtDate(o.stageTimestamps.cad)}</Text>
              <Text style={[styles.cell, { width: COLS[11].width }]}>{fmtDate(o.stageTimestamps.casting)}</Text>
              <Text style={[styles.cell, { width: COLS[12].width }]}>
                {fmtDate(o.stageTimestamps.inProduction)}
              </Text>
              <Text style={[styles.cell, { width: COLS[13].width }]}>
                {fmtDate(o.stageTimestamps.readyToDispatch)}
              </Text>
              <Text style={[styles.cell, { width: COLS[14].width }]}>{o.productionNotes ?? "—"}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
