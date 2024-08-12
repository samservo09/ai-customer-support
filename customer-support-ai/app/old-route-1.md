import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
export async function POST(request) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const data = await request.json();
  const userPrompt = data.prompt; // Assuming the user prompt is sent in the request body

  try {
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();
    return NextResponse.json({ text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message });
  }
}