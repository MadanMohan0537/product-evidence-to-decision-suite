import { designExperiment, type ExperimentDesignRequest } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json() as ExperimentDesignRequest;
    if (typeof body.goal !== "string" || body.goal.trim().length < 10 || body.goal.length > 4000) {
      return Response.json({ error: "Describe the product goal in at least 10 characters." }, { status: 400 });
    }
    const design = await designExperiment(body);
    return Response.json({ design, provider: process.env.DEEPSEEK_API_KEY ? "deepseek" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "local-outline" });
  } catch (error) {
    console.error("Experiment design failed", error);
    return Response.json({ error: "The experiment design could not be generated. Please try again." }, { status: 502 });
  }
}

