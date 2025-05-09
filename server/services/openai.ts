import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat completion function
export async function openaiChat(
  messages: Array<{ role: string, content: string }>,
  scriptContext: string = "",
  stream: boolean = false
) {
  // Prepare system message with script context if available
  const systemMessage = {
    role: "system",
    content: `You are a helpful assistant for the WhisperShard project that specializes in script and scene lookup.
${scriptContext ? `Here is some relevant script information that might help with the response:\n${scriptContext}` : ""}
When referring to specific scripts or scenes, always include the reference information at the end of your response.`
  };

  // Add system message at the beginning if it doesn't exist
  const updatedMessages = [
    systemMessage,
    ...messages
  ];

  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  if (stream) {
    return await openai.chat.completions.create({
      model: "gpt-4o",
      messages: updatedMessages,
      stream: true
    });
  } else {
    return await openai.chat.completions.create({
      model: "gpt-4o",
      messages: updatedMessages
    });
  }
}
