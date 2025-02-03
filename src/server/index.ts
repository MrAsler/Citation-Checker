// server.ts
import { serve } from "bun";

interface OpenAlexWork {
  id: string;
  title: string;
  display_name: string;
  publication_year: number;
  // ... other fields as needed
}

class OpenAlexAPI {
  private baseUrl = "https://api.openalex.org";

  async searchExactWork(title: string): Promise<OpenAlexWork[]> {
    try {
      const encodedTitle = encodeURIComponent(`"${title}"`);
      const url = `${this.baseUrl}/works?filter=title.search:${encodedTitle}&select=id,display_name`;
      console.log(url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error searching OpenAlex:", error);
      throw error;
    }
  }
}

const openAlex = new OpenAlexAPI();

const server = serve({
  port: 3000,
  async fetch(req) {
    // Enable CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    console.log("Boink2");

    const results = await openAlex.searchExactWork(
      "Multimodal emotion recognition in response to videos",
    );
    console.log(results);

    // Handle OPTIONS request for CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Parse the URL
    const url = new URL(req.url);

    // Handle search endpoint
    if (url.pathname === "/api/search" && req.method === "POST") {
      console.log("Found a big beep boop!");
      try {
        const body = await req.json();
        const { title } = body;

        if (!title) {
          return new Response(JSON.stringify({ error: "Title is required" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }

        const results = await openAlex.searchExactWork(title);

        return new Response(JSON.stringify(results), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Internal server error" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          },
        );
      }
    } else {
      return new Response("Welcome to Bun!");
    }

    // Handle 404
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
