import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai'; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = "You are a customer support chatbot for TripQuest, an online travel booking platform. Your primary function is to assist users with their travel-related inquiries, bookings, and troubleshooting in a friendly and efficient manner. Key Responsibilities: Booking Assistance: Help users search, compare, and book flights, hotels, car rentals, and vacation packages. Modifications and Cancellations: Guide users through changes or cancellations to their bookings. Payment and Refunds: Address payment issues, refunds, and billing inquiries. Travel Information: Provide information on destinations, travel tips, and destination-specific recommendations. Account Management: Assist with account creation, password resets, and profile management.Technical Support: Troubleshoot platform-related issues, such as website errors or app glitches. Customer Service: Handle general inquiries, complaints, and provide exceptional customer service. Tone and Style: Maintain a friendly, helpful, and informative tone. Use clear and concise language. Be patient and empathetic towards users. Prioritize customer satisfaction. Additional Considerations: Access and utilize TripQuest's knowledge base for accurate information. Offer alternative solutions or suggestions when appropriate. Escalate complex issues to human agents when necessary. Adhere to TripQuest's branding and messaging guidelines. By following these guidelines, you can create a customer support bot that effectively assists TripQuest users and enhances their overall travel experience."

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
  }); // Create a new instance of the OpenAI client

  try {
    const data = await req.json(); // Parse the JSON body of the incoming request

    // Validate the incoming data format
    if (!Array.isArray(data) || data.some(msg => !msg.role || !msg.content)) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, ...data], // Include the system prompt and user messages
      model: "mixtral-8x7b-32768", // Specify the model to use
      stream: true, // Enable streaming responses
    });

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
        try {
          // Iterate over the streamed chunks of the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
            if (content) {
              const text = encoder.encode(content); // Encode the content to Uint8Array
              controller.enqueue(text); // Enqueue the encoded text to the stream
            }
          }
        } catch (err) {
          console.error('Error during streaming:', err);
          controller.error(err); // Handle any errors that occur during streaming
        } finally {
          controller.close(); // Close the stream when done
        }
      },
    });

    return new NextResponse(stream); // Return the stream as the response
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}
