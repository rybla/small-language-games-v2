import { ai } from "@/ai";
import { z } from "genkit";
import {
  ConvoTreeEdge,
  NpcState,
  NpcStateDiffs,
  NpcStatePredicateRow,
  NpcStatePredicates as NpcStatePredicates,
  State,
} from "./common";
import {
  getConvoTreeEdgesFromNode,
  getCurrentConvoTreeNode,
} from "./semantics";
import { match } from "@/utility";

export const InterpretNpcStatePredicates = ai.defineFlow(
  {
    name: "InterpretNpcStatePredicate",
    inputSchema: z.object({
      state: NpcState,
      preds: NpcStatePredicates,
    }),
    outputSchema: z.boolean(),
  },
  async ({ state, preds }) => {
    let result = true;
    for (const p of preds) {
      await match<NpcStatePredicateRow, Promise<void>>(p, {
        async knowsFact(x) {
          // TODO: instead do LLM query
          if (!state.facts.includes(x.fact)) {
            result = false;
          }
        },
      });
      if (!result) break;
    }
    return result;
  },
);

export const GenerateNpcResponse = ai.defineFlow(
  {
    name: "GenerateNpcResponse",
    inputSchema: z.object({
      state: State,
    }),
    outputSchema: z.object({
      response: z.string(),
      diffs: NpcStateDiffs,
    }),
  },
  async ({ state }) => {
    return {
      response: "hello world",
      diffs: [],
    };
  },
);
