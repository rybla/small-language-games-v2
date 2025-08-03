import { ai } from "@/ai";
import { z } from "genkit";
import {
  ConvoTreeEdge,
  NpcState,
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
      state: State,
    }),
  },
  async ({ state }) => {
    // check for move in convo tree BEFORE response

    const node = getCurrentConvoTreeNode(state);
    const edges = getConvoTreeEdgesFromNode(state.convoTree, node.id);
    // the first satisfied edge
    let edge_result: ConvoTreeEdge | undefined;
    for (const edge of edges) {
      const edgeIsSatisfied = await InterpretNpcStatePredicates({
        state: state.npcState,
        preds: edge.preds,
      });
      if (edgeIsSatisfied) {
        edge_result = edge;
        break;
      }
    }

    if (edge_result !== undefined) {
      // TODO: follow edge
    } else {
      // not following an edge yet
    }

    return {
      state,
    };
  },
);
