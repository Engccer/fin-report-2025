"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.warn("GOOGLE_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export async function categorizeTransaction(description: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" }); // Trying requested model

    const prompt = `
      You are a financial assistant for a Korean teachers' union.
      Categorize the following bank transaction description into one of these categories:
      "사무비", "사업비", "회의비", "인건비", "기타", "수입".

      Description: "${description}"

      Return ONLY the category name.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error: any) {
        // Fallback if model not found
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            console.log("gemini-3-flash not found, falling back to gemini-2.0-flash-exp");
             const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
             const result = await fallbackModel.generateContent(prompt);
             const response = await result.response;
             return response.text().trim();
        }
        throw error;
    }

  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return "기타"; // Default fallback
  }
}

export async function categorizeTransactionsBatch(descriptions: string[]) {
    // Determine efficient batching or parallel requests
    // For now, parallel requests with Promise.all (simple implementation)
    // In production, might want to batch into a single prompt for efficiency

    // Batch prompt approach
     try {
        // First try gemini-3-flash
        let model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        const prompt = `
          You are a financial assistant for a Korean teachers' union.
          Categorize the following list of bank transaction descriptions.
          Categories: "사무비", "사업비", "회의비", "인건비", "기타", "수입".

          Return a JSON array of strings, where each string corresponds to the category of the description at the same index.
          Example input: ["Office supplies", "Salary"]
          Example output: ["사무비", "인건비"]

          Descriptions:
          ${JSON.stringify(descriptions)}
        `;

        try {
             const result = await model.generateContent(prompt);
             const response = await result.response;
             const text = response.text();
             // Clean up markdown code blocks if present
             const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
             return JSON.parse(jsonStr);
        } catch(error: any) {
             if (error.message?.includes("404") || error.message?.includes("not found")) {
                console.log("gemini-3-flash not found, falling back to gemini-2.0-flash-exp");
                model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                 const result = await model.generateContent(prompt);
                 const response = await result.response;
                 const text = response.text();
                 const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                 return JSON.parse(jsonStr);
             }
             throw error;
        }

    } catch (error) {
        console.error("Batch categorization failed:", error);
        return descriptions.map(() => "기타");
    }
}

export async function analyzeFinancialData(dataContext: string, question: string) {
    try {
        let model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        const prompt = `
        Context: The following is financial data for the union.
        ${dataContext}

        User Question: ${question}

        Answer the question based on the data provided. Be concise and helpful. Use Korean.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch(error: any) {
             if (error.message?.includes("404") || error.message?.includes("not found")) {
                 model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                 const result = await model.generateContent(prompt);
                 const response = await result.response;
                 return response.text();
             }
             throw error;
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        return "죄송합니다. 데이터를 분석하는 중 오류가 발생했습니다.";
    }
}
