import { cleanExtractedText } from "./text-preprocessor"

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Supported file types
const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

/**
 * Validates a resume file
 * @param file The file to validate
 * @returns An object with validation result and message
 */
export function validateResumeFile(file: File): { valid: boolean; message?: string } {
  // Check if file exists
  if (!file) {
    return { valid: false, message: "No file selected" }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  // Check file type
  if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Unsupported file type. Please upload a PDF, DOCX, or TXT file`,
    }
  }

  return { valid: true }
}

/**
 * STEP 1: Extract raw text from a file
 * This function ONLY extracts text without any skill analysis
 * @param file The file to extract text from
 * @param onProgress Optional callback for progress updates
 * @returns The extracted raw text
 */
export async function extractTextFromFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    // Report initial progress
    if (onProgress) onProgress(10)

    let extractedText = ""

    // For text files, just read the text
    if (file.type === "text/plain") {
      extractedText = await file.text()
      if (onProgress) onProgress(100)
    }
    // For PDF files
    else if (file.type === "application/pdf") {
      if (onProgress) onProgress(30)

      // In a production environment, we would use pdf.js
      // For now, we'll use a simplified approach to demonstrate the two-step process

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer()
      if (onProgress) onProgress(50)

      // Extract text from PDF (simplified)
      extractedText = await extractTextFromPDF(arrayBuffer)
      if (onProgress) onProgress(90)
    }
    // For DOCX files
    else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      if (onProgress) onProgress(30)

      // In a production environment, we would use mammoth.js
      // For now, we'll use a simplified approach to demonstrate the two-step process

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer()
      if (onProgress) onProgress(50)

      // Extract text from DOCX (simplified)
      extractedText = await extractTextFromDOCX(arrayBuffer)
      if (onProgress) onProgress(90)
    }

    // Clean the extracted text
    const cleanedText = cleanExtractedText(extractedText)
    if (onProgress) onProgress(100)

    return cleanedText
  } catch (error) {
    console.error("Error extracting text from file:", error)
    throw new Error(`Failed to extract text from ${file.name}: ${error.message}`)
  }
}

/**
 * Extract text from a PDF file (simplified implementation)
 * In a production environment, this would use pdf.js
 */
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // This is a placeholder for pdf.js implementation
  // In a real application, we would use pdf.js to extract text from the PDF

  // For demonstration purposes, we'll return a message indicating this is a simplified implementation
  return "This is a simplified PDF text extraction. In a production environment, we would use pdf.js to extract the actual text content from your PDF file. Please paste your resume text directly for accurate skill extraction."
}

/**
 * Extract text from a DOCX file (simplified implementation)
 * In a production environment, this would use mammoth.js
 */
async function extractTextFromDOCX(buffer: ArrayBuffer): Promise<string> {
  // This is a placeholder for mammoth.js implementation
  // In a real application, we would use mammoth.js to extract text from the DOCX

  // For demonstration purposes, we'll return a message indicating this is a simplified implementation
  return "This is a simplified DOCX text extraction. In a production environment, we would use mammoth.js to extract the actual text content from your DOCX file. Please paste your resume text directly for accurate skill extraction."
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use validateResumeFile instead
 */
export function isValidResumeFile(file: File): boolean {
  return validateResumeFile(file).valid
}
