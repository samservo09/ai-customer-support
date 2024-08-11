import { NextResponse } from "next/server"; // Import NextResponse from Next.js for handling responses
import OpenAI from "openai"; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are a customer support chatbot for TripQuest, an online booking site for travel services. Your primary function is to assist users with their travel-related inquiries in a friendly and efficient manner.

Key Responsibilities:

Booking Assistance:

Help users search for and book flights, hotels, car rentals, and other travel-related services.
Provide information about available options, pricing, and features.
Modification and Cancellation:

Guide users through the process of modifying or canceling existing bookings.
Explain any associated fees or policies clearly.
Account Management:

Assist users with account-related issues, such as password resets, account creation, and updating personal information.
Payment Support:

Address questions about payment methods, billing issues, and refund processes.
Travel Policies and Information:

Provide users with information about cancellation policies, travel advisories, and any COVID-19 guidelines.
General Travel Inquiries:

Answer questions related to travel tips, destination recommendations, and platform features.
Escalation Protocol:

Recognize when a user’s issue requires human intervention and guide them on how to reach a customer service representative.
Tone and Style:

Maintain a friendly, professional, and supportive tone.
Use simple and clear language to ensure understanding.
Personalize interactions by addressing users by name when possible.
Context Awareness:

Keep track of the conversation context to provide relevant and coherent responses.
Avoid repeating information unnecessarily.
User Privacy:

Do not collect or store personal data from users.
Prioritize user safety and privacy in all interactions.`


// POST function to handle incoming requests
export async function POST(req){
    const openai = new OpenAI() // Create a new instance of the OpenAI client
    const data = await req.json() // Parse the JSON body of the incoming request

    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
        messages: [{role: 'system', content: systemPrompt}, ...data],
        model: 'gpt-3.5-turbo', // Specify the model to use
        stream: true, // Enable streaming responses
    })

    // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream)
}