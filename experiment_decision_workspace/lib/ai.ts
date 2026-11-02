export type ExperimentDesignRequest = {
  goal: string;
  productArea?: string;
  audience?: string;
};

export type ExperimentDesign = {
  hypothesis: string;
  primaryMetric: string;
  guardrailMetrics: string[];
  suggestedSegments: string[];
  durationDays: number;
  risks: string[];
  confidence: number;
};

const systemPrompt = `You are an experienced product experimentation scientist.
Return only valid JSON. Design a rigorous experiment from the supplied product goal.
Use this schema: {"hypothesis":string,"primaryMetric":string,"guardrailMetrics":string[],"suggestedSegments":string[],"durationDays":number,"risks":string[],"confidence":number}.
Confidence must be an integer from 0 to 100. Do not invent a precise sample size without baseline traffic and conversion data.`;

export async function designExperiment(input: ExperimentDesignRequest): Promise<ExperimentDesign> {
  const prompt = `Goal: ${input.goal}\nProduct area: ${input.productArea ?? "Not specified"}\nAudience: ${input.audience ?? "Not specified"}`;

  if (process.env.DEEPSEEK_API_KEY) {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat", temperature: 0.25, response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] }),
    });
    if (!response.ok) throw new Error(`DeepSeek request failed (${response.status})`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as ExperimentDesign;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5", max_tokens: 900, temperature: 0.25, system: systemPrompt, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) throw new Error(`Anthropic request failed (${response.status})`);
    const data = await response.json() as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find(item => item.type === "text")?.text ?? "{}";
    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as ExperimentDesign;
  }

  return {
    hypothesis: `For ${input.audience?.trim() || "the target audience"}, test whether a scoped change supports this goal: ${input.goal.trim()}. Declare the treatment and success threshold before launch.`,
    primaryMetric: "Conversion rate for the stated user outcome",
    guardrailMetrics: ["Error rate", "Retention", "Support contact rate"],
    suggestedSegments: [input.audience?.trim() || "Target audience"],
    durationDays: 14,
    risks: ["Baseline traffic and conversion must be supplied", "Novelty and assignment effects require review"],
    confidence: 0,
  };
}
