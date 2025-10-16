import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test database connection by querying categories
    const { data, error } = await supabase
      .from("categories")
      .select("count")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          database: "disconnected",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
      message: "Inbound Knowledge Base API is running",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
