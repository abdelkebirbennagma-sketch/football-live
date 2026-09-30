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
    const formatter = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Africa/Casablanca",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    );

    const today = formatter.format(new Date());


    // رابط API-Football
    const apiUrl =
      "https://v3.football.api-sports.io/fixtures" +
      "?date=" +
      encodeURIComponent(today) +
      "&timezone=" +
      encodeURIComponent("Africa/Casablanca");


    // Timeout باش ما يبقاش الطلب عالق
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);


    let response;

    try {

      response = await fetch(
        apiUrl,
        {
          method: "GET",

          headers: {
            "x-apisports-key": apiKey,
            "Accept": "application/json"
          },

          signal: controller.signal
        }
      );

    } catch (error) {

      clearTimeout(timeout);


      if (error.name === "AbortError") {

        return new Response(
          JSON.stringify({
            error: "API-Football timeout",
            details: "API-Football did not respond within 8 seconds."
          }),
          {
            status: 504,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

      }


      return new Response(
        JSON.stringify({
          error: "Could not connect to API-Football",
          details: error.message
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    } finally {

      clearTimeout(timeout);

    }


    // قراءة الرد
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


    // HTTP error
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


    // API-Football رجعات errors رغم HTTP 200
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


    // كلشي مزيان
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
