import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define our own types to match OpenAI's required structure
type ChatRole = "user" | "assistant" | "system";
type ChatMessage = {
  role: ChatRole;
  content: string;
};

// Chat completion function
export async function openaiChat(
  messages: Array<{ role: string, content: string }>,
  scriptContext: string = "",
  stream: boolean = false,
  mode: string = "narrate"
) {
  // Convert messages to the proper type
  const typedMessages: ChatMessage[] = messages.map(msg => ({
    role: msg.role as ChatRole,
    content: msg.content
  }));
  // Prepare system message with script context if available
  const systemMessage = {
    role: "system",
    content: `You are a helpful assistant for the WhisperShard project that specializes in script and scene lookup.
${scriptContext ? `Here is some relevant script information that might help with the response:\n${scriptContext}` : ""}
When referring to specific scripts or scenes, always include the reference information at the end of your response.

You have creative freedom to use emojis 🎲 and emoticons where appropriate to make your responses engaging, especially for game-related or fantastical content.

For narration content, visually distinguish it by starting with [NARRATION] and ending with [/NARRATION] tags. The UI will render this as a green narration card.

When the user asks about scenes, monsters, items, or environment descriptions, respond with a vivid narration that helps immerse them in the scenario.

Your current mode is: ${mode.toUpperCase()}
${mode === "interpret" ? "In this mode, focus on interpreting game rules, mechanics, and providing clear explanations." : "In this mode, focus on narrating scenes and creating an immersive storytelling experience."}`
  };

  // Add system message at the beginning
  const systemTypedMessage: ChatMessage = {
    role: "system",
    content: systemMessage.content
  };

  // Create the final array of properly typed messages
  const updatedMessages: ChatMessage[] = [
    systemTypedMessage,
    ...typedMessages
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
