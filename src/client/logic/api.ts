// api.ts
interface OpenAlexWork {
  id: string;
  title: string;
  display_name: string;
  publication_year: number;
  // ... other fields as needed
}

class PaperAPI {
  private baseUrl = "http://localhost:3000/api";

  async searchPaper(title: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      console.log(response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching paper:", error);
      throw error;
    }
  }
}

// Usage example
const api = new PaperAPI();

// Example component or function using the API
export async function searchPaper(title: string) {
  try {
    const results = await api.searchPaper(title);
    console.log("Search results:", results);
    return results;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
