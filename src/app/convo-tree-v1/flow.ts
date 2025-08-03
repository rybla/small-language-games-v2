import { ai } from "@/ai";
import { z } from "genkit";
import { ConvoTreeEdge, NpcStatePredicate, State } from "./common";
import {
  getConvoTreeEdgesFromNode,
  getCurrentConvoTreeNode,
} from "./semantics";

export const InterpretNpcStatePredicate = ai.defineFlow(
  {
    name: "InterpretNpcStatePredicate",
    inputSchema: z.object({
      state: State,
      pred: NpcStatePredicate,
    }),
    outputSchema: z.boolean(),
  },
  async ({ state, pred }) => {
    // TODO
    return true;
  },
);

export const GenerateNpcResponse = ai.defineFlow(
  {
    name: "GenerateNpcResponse",
    inputSchema: z.object({
      state: State,
    }),
    outputSchema: z.object({
      edge: z.optional(ConvoTreeEdge),
    }),
  },
  async ({ state }) => {
    const node = getCurrentConvoTreeNode(state);
    const edges = getConvoTreeEdgesFromNode(state.convoTree, node.id);
    let edge_result: ConvoTreeEdge | undefined;
    for (const edge of edges) {
      const edgeIsSatisfied = await InterpretNpcStatePredicate({
        state,
        pred: edge.pred,
      });
      if (edgeIsSatisfied) {
        edge_result = edge;
        break;
      }
    }
    return {
      edge: edge_result,
    };
  },
);
