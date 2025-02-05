const apiUrl = import.meta.env.VITE_API_URL;
// /api/search

export async function searchPaperByTitle(title: string): Promise<Response> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    console.log(response);

    return response;
  } catch (error) {
    console.log("Error searching paper:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to search paper" }), {
      status: 500, // or any appropriate error status code
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
