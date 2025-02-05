// server.ts
import { serve } from "bun";

const server = serve({
  port: 3000,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      if (url.pathname === "/api/search" && req.method === "POST") {
        const body = await req.json();
        const { title } = body;
        return await handleSearchRequest(title);
      } else if (url.pathname === "/check-health") {
        return new Response("Hello!");
      } else {
        // Handle 404
        return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.log(error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

const OPEN_ALEX_BASE_URL = "https://api.openalex.org";
async function handleSearchRequest(title: string | null): Promise<Response> {
  if (title == null) {
    return new Response(JSON.stringify({ error: "Title is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (title.length >= 500) {
    return new Response(
      JSON.stringify({
        error: "The title's length is too big (over 500 characters)",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const encodedTitle = encodeURIComponent(`"${title}"`);
  const url = `${OPEN_ALEX_BASE_URL}/works?filter=title.search:${encodedTitle}&select=id,display_name`;
  const response = await fetch(url);

  if (!response.ok) {
    console.log(response);
    const errorMessage = await response.json();
    console.log(errorMessage);
    return new Response(errorMessage, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await response.json();

  return new Response(JSON.stringify(data.results || []), {
    headers: { "Content-Type": "application/json" },
  });
}

console.log(`Server running at http://localhost:${server.port}`);
