import type { Part } from "@google/genai";

/**
 * Helper utility for manipulating parts and attachments for Gemini API requests.
 * Provides methods to convert files, buffers, and base64 strings into the `Part` objects required by the Gemini SDK.
 */
export class GeminiAttachmentHelper {
  /**
   * Convert a raw File object into a base64 encoded string.
   */
  public static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // Extract just the base64 part
          const b64 = reader.result.split(",")[1];
          resolve(b64);
        } else {
          reject(new Error("Failed to read file to base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Create an inline data Part from a File object.
   * Useful for passing images or documents from the browser directly to the SDK.
   */
  public static async CreateFromFile(file: File): Promise<Part> {
    const base64Data = await this.fileToBase64(file);
    return {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    };
  }

  /**
   * Create an inline data Part from a Buffer (useful in Node.js / Server environments).
   */
  public static CreateFromBuffer(buffer: Buffer, mimeType: string): Part {
    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: mimeType,
      },
    };
  }

  /**
   * Create an inline data Part from a base64 string.
   */
  public static CreateFromBase64(base64: string, mimeType: string): Part {
    return {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };
  }
}
