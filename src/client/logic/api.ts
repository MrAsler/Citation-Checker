const baseUrl = "http://localhost:3000/api";

export async function searchPaperByTitle(title: string): Promise<Response> {
  try {
    const response = await fetch(`${baseUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    console.log(response);

    return response;
  } catch (error) {
    console.error("Error searching paper:", error);
    throw error;
  }
}
