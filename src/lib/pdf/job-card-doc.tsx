import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { Order } from "@/types/order";

const styles = StyleSheet.create({
  singlePage: { padding: 24, fontSize: 10, fontFamily: "Helvetica" },
  gridPage: { padding: 16, flexDirection: "row", flexWrap: "wrap" },
  card: {
    width: "50%",
    height: "33.33%",
    padding: 10,
    border: "1pt solid #000",
    boxSizing: "border-box",
  },
  header: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  image: { width: 70, height: 70, objectFit: "cover", marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 8, color: "#555" },
  value: { fontSize: 9, marginBottom: 3 },
});

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function CardContent({ order }: { order: Order }) {
  return (
    <>
      <Text style={styles.header}>
        {order.brand ?? "—"} · {order.id}
      </Text>
      {order.imagePath && <Image style={styles.image} src={order.imagePath} />}
      <View style={styles.row}>
        <Text style={styles.label}>Order Date</Text>
        <Text style={styles.label}>Ship Date</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.value}>{fmtDate(order.orderDate)}</Text>
        <Text style={styles.value}>{fmtDate(order.shipBy)}</Text>
      </View>
      <Text style={styles.label}>Metal / KT</Text>
      <Text style={styles.value}>
        {order.metalKt ?? "—"} {order.metalColor ?? ""}
      </Text>
      <Text style={styles.label}>Stone Quality</Text>
      <Text style={styles.value}>{order.stoneQuality ?? "—"}</Text>
      <Text style={styles.label}>Buyer Name</Text>
      <Text style={styles.value}>{order.buyerName ?? "—"}</Text>
      <Text style={styles.label}>Size</Text>
      <Text style={styles.value}>{order.size ?? "—"}</Text>
      <Text style={styles.label}>Remark</Text>
      <Text style={styles.value}>{order.remark ?? "—"}</Text>
    </>
  );
}

export function SingleJobCardDoc({ order }: { order: Order }) {
  return (
    <Document>
      <Page size="A4" style={styles.singlePage}>
        <View style={{ maxWidth: 300 }}>
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
