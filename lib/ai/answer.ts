import Groq from 'groq-sdk'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function answerFromChunks(
  query: string,
  chunks: Array<{ chunk_text: string; meeting_title: string; meeting_created_at: string }>
): Promise<string> {
  if (chunks.length === 0) {
    return "I couldn't find any relevant information in your meeting recordings for that query."
  }

  const context = chunks
    .map(
      (c, i) =>
        `[Excerpt ${i + 1} from "${c.meeting_title}" on ${new Date(c.meeting_created_at).toLocaleDateString()}]:\n${c.chunk_text}`
    )
    .join('\n\n---\n\n')

  const prompt = `You are a meeting assistant. Answer the user's question based ONLY on the following transcript excerpts from their meetings.
If the answer is not found in the excerpts, say "I don't know based on your meeting recordings."
Always cite which meeting the information came from.

TRANSCRIPT EXCERPTS:
${context}

QUESTION: ${query}

Answer concisely and cite the meeting source.`

  const response = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  })

  return response.choices[0]?.message?.content ?? "I couldn't generate an answer."
}
