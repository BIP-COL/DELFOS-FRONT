  export const runtime = "edge";

const BACKEND_URL =
  process.env.DELFOS_BACKEND_URL || "http://127.0.0.1:8000/chat";

export async function POST(req: Request): Promise<Response> {
  try {
    const { inputCode, userId } = await req.json(); // lo que envía el front

    // Lo que espera el backend FastAPI
    const payload = {
      message: inputCode,
      user_id: userId ?? "anonymous",
    };

    const backendRes = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload), // payload debe contener inputCode y userId
  });

  const text = await backendRes.text();

    if (!backendRes.ok) {
      console.error("Error backend Delfos:", text);
      return new Response(text, { status: backendRes.status });
    }

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error llamando al backend Delfos:", error);
    return new Response("Error llamando al backend Delfos", { status: 500 });
  }
}

export async function GET() {
  return new Response("Método no soportado", { status: 405 });
}