import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { Order } from "@/types/order";

const BORDER = "0.75pt solid #000";

const styles = StyleSheet.create({
  singlePage: { padding: 24, fontFamily: "Helvetica" },
  gridPage: { padding: 16, flexDirection: "row", flexWrap: "wrap" },
  card: {
    width: "50%",
    height: "33.33%",
    boxSizing: "border-box",
    border: BORDER,
  },
  singleCard: { width: 320, border: BORDER },

  header: {
    fontSize: 12,
    fontWeight: 700,
    padding: 8,
    borderBottom: BORDER,
  },
  image: { width: 64, height: 64, objectFit: "cover", margin: 8, alignSelf: "center" },

  splitRow: { flexDirection: "row", borderBottom: BORDER },
  splitCell: { width: "50%", padding: 6 },
  splitCellDivider: { width: "50%", padding: 6, borderLeft: BORDER },

  tableRow: { flexDirection: "row", borderBottom: BORDER, minHeight: 20 },
  tableRowLast: { flexDirection: "row", minHeight: 20 },
  labelCell: { width: "32%", padding: 6, borderRight: BORDER, backgroundColor: "#f5f5f5" },
  valueCell: { width: "68%", padding: 6 },

  label: { fontSize: 8, color: "#555" },
  value: { fontSize: 9, fontWeight: 700 },
});

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? styles.tableRowLast : styles.tableRow}>
      <View style={styles.labelCell}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueCell}>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function CardContent({ order }: { order: Order }) {
  return (
    <>
      <Text style={styles.header}>
        {order.brand ?? "—"} · {order.id}
      </Text>
      {order.imagePath && <Image style={styles.image} src={order.imagePath} />}
      <View style={styles.splitRow}>
        <View style={styles.splitCell}>
          <Text style={styles.label}>Order Date</Text>
          <Text style={styles.value}>{fmtDate(order.orderDate)}</Text>
        </View>
        <View style={styles.splitCellDivider}>
          <Text style={styles.label}>Ship Date</Text>
          <Text style={styles.value}>{fmtDate(order.shipBy)}</Text>
        </View>
      </View>
      <Row label="Metal / KT" value={`${order.metalKt ?? "—"} ${order.metalColor ?? ""}`.trim()} />
      <Row label="Stone Quality" value={order.stoneQuality ?? "—"} />
      <Row label="Buyer Name" value={order.buyerName ?? "—"} />
      <Row label="Size" value={order.size ?? "—"} />
      <Row label="Remark" value={order.remark ?? "—"} last />
    </>
  );
}

export function SingleJobCardDoc({ order }: { order: Order }) {
  return (
    <Document>
      <Page size="A4" style={styles.singlePage}>
        <View style={styles.singleCard}>
          <CardContent order={order} />
        </View>
      </Page>
    </Document>
  );
}

export function BulkJobCardsDoc({ orders }: { orders: Order[] }) {
  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += 6) {
    pages.push(orders.slice(i, i + 6));
  }

  return (
    <Document>
      {pages.map((pageOrders, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.gridPage}>
          {pageOrders.map((order) => (
            <View key={order.id} style={styles.card}>
              <CardContent order={order} />
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
