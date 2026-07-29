import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";

const RECEIPT_SCHEMA = {
  type: "object",
  properties: {
    vendor: {
      type: "string",
      description: "Vendor or shop name as printed on the receipt. Empty string if unreadable.",
    },
    date: {
      type: "string",
      description:
        "Date on the receipt in YYYY-MM-DD format. Empty string if not visible or not determinable.",
    },
    total: {
      type: "number",
      description:
        "The final total amount paid, as a plain number with no currency symbol (assume Indian Rupees). 0 if not determinable.",
    },
    summary: {
      type: "string",
      description:
        "A short 3-8 word description of what this expense was for, suitable as an expense category label -- e.g. 'Electricity bill' or 'Polishing chemicals - ABC Traders'.",
    },
  },
  required: ["vendor", "date", "total", "summary"],
  additionalProperties: false,
};

type Extracted = { vendor: string; date: string; total: number; summary: string };

export async function POST(req: NextRequest) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("order-images")
    .upload(path, await file.arrayBuffer(), { contentType: "image/jpeg" });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  const { data: urlData } = supabase.storage.from("order-images").getPublicUrl(path);
  const imagePath = urlData.publicUrl;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      imagePath,
      extracted: null,
      warning: "Auto-extraction isn't set up yet (missing API key) -- photo saved, enter the amount manually.",
    });
  }

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: RECEIPT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imagePath } },
            {
              type: "text",
              text: "This is a photo of a receipt or bill for a small jewelry manufacturing business's expense records. Read every visible field carefully and extract the vendor name, the date, the total amount paid (assume Indian Rupees, return just the number), and a short summary of what the expense was for.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        imagePath,
        extracted: null,
        warning: "Auto-extraction declined this image -- photo saved, enter the amount manually.",
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const extracted: Extracted | null = textBlock ? JSON.parse(textBlock.text) : null;

    return NextResponse.json({ imagePath, extracted });
  } catch (e) {
    return NextResponse.json({
      imagePath,
      extracted: null,
      warning: e instanceof Error ? e.message : "Auto-extraction failed -- photo saved, enter the amount manually.",
    });
  }
}
