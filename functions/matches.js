export async function onRequestGet(context) {
  const apiKey = context.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?date=${today}`,
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
      "Cache-Control": "public, max-age=300"
    }
  });
}
