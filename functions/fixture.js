export async function onRequestGet(context) {
  const apiKey = context.env.API_FOOTBALL_KEY;

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  if (!id) {
    return new Response(
      JSON.stringify({ error: "Missing fixture id" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?id=${encodeURIComponent(id)}`,
    {
      headers: {
        "x-apisports-key": apiKey
      }
    }
  );

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30"
    }
  });
}
