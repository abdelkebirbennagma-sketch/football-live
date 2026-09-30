export async function onRequestGet(context) {

try {

const apiKey = context.env.API_FOOTBALL_KEY;

if (!apiKey) {

  return new Response(
    JSON.stringify({
      error: "API key not configured"
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

}


// تاريخ المغرب
const today = new Intl.DateTimeFormat(
  "en-CA",
  {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }
).format(new Date());


const apiUrl =
  "https://v3.football.api-sports.io/fixtures" +
  "?date=" +
  today +
  "&timezone=Africa%2FCasablanca";


const response = await fetch(
  apiUrl,
  {
    method: "GET",
    headers: {
      "x-apisports-key": apiKey,
      "Accept": "application/json"
    }
  }
);


const text = await response.text();


let data;

try {

  data = JSON.parse(text);

} catch {

  return new Response(
    JSON.stringify({
      error: "Invalid response from API-Football",
      status: response.status,
      details: text.substring(0, 500)
    }),
    {
      status: 502,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

}


// API-Football نفسها رجعات خطأ
if (!response.ok) {

  return new Response(
    JSON.stringify({
      error: "API-Football request failed",
      status: response.status,
      details: data
    }),
    {
      status: response.status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

}


// API-Football قد ترجع HTTP 200 ولكن فيها errors
if (
  data.errors &&
  Object.keys(data.errors).length > 0
) {

  return new Response(
    JSON.stringify({
      error: "API-Football error",
      details: data.errors
    }),
    {
      status: 502,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

}


return new Response(
  JSON.stringify(data),
  {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    }
  }
);

} catch (error) {

return new Response(
  JSON.stringify({
    error: "Server error",
    details: error.message
  }),
  {
    status: 500,
    headers: {
      "Content-Type": "application/json"
    }
  }
);

}

}
