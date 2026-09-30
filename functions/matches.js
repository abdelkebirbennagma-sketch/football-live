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

    const apiUrl =
      "https://v3.football.api-sports.io/fixtures" +
      "?date=" +
      encodeURIComponent(today) +
      "&timezone=" +
      encodeURIComponent("Africa/Casablanca");

    /*
      Cache API-Football response.

      جميع الزوار غادي يستعملو نفس النتيجة
      لمدة 5 دقائق بدل ما كل زائر يرسل
      طلب جديد إلى API-Football.
    */

    const cache = caches.default;

    const cacheKey = new Request(
      "https://football-live-cache.local/matches/" +
      today
    );

    // محاولة أخذ البيانات من Cache
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {

      return new Response(
        cachedResponse.body,
        {
          status: cachedResponse.status,
          headers: {
            "Content-Type": "application/json",
            "X-Football-Cache": "HIT"
          }
        }
      );

    }

    /*
      لم نجد البيانات في Cache.
      نطلبها من API-Football.
    */

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

    /*
      API-Football rate limit
    */

    if (
      data.errors &&
      Object.keys(data.errors).length > 0
    ) {

      return new Response(
        JSON.stringify({
          error: "خطأ في واجهة برمجة التطبيقات لكرة القدم",
          details: data.errors
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );

    }

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

    /*
      Response التي غادي نخزنوها في Cache.

      Cache-Control = 5 دقائق
    */

    const cacheResponse = new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300"
        }
      }
    );

    /*
      تخزين النتيجة في Cloudflare Cache
    */

    context.waitUntil(
      cache.put(
        cacheKey,
        cacheResponse.clone()
      )
    );

    /*
      إرسال النتيجة للزائر
    */

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
          "X-Football-Cache": "MISS"
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
