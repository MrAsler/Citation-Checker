const apiUrl = import.meta.env.VITE_API_URL!;

export async function searchPaperByTitle(title: string): Promise<Response> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    return response;
  } catch (error) {
    var errorMessage = "Failed to search paper";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.log("Error searching paper:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, // or any appropriate error status code
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
