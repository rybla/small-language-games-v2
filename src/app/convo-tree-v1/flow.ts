import { ai } from "@/ai";
import { z } from "genkit";

export const GenerateNpcResponse = ai.defineFlow(
  {
    name: "GenerateNpcResponse",
    inputSchema: z.object({}),
    outputSchema: z.object({}),
  },
  async ({}) => {},
);
