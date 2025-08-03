import { Sig } from "@/library/sva";
import { Subtype, UnionToRecord } from "@/utility";
import { z } from "genkit";

// -----------------------------------------------------------------------------
// S
// -----------------------------------------------------------------------------

export const name = "convo-tree-v1" as const;

export type S = Subtype<
  {
    name: typeof name;
    view: View;
    state: State;
    action: Action;
    params_initialize: { prompt: string };
    params_action: { prompt: string };
  },
  Sig
>;

export type View = {
  state: State;
  turns: { params: S["params_action"]; actions: Action[] }[];
};

export type State = z.infer<typeof State>;
export const State = z.object({
  convoTree: z.lazy(() => ConvoTree),
  currentId: z.lazy(() => ConvoTreeNodeId),
  npcState: z.lazy(() => NpcState),
});

export type Action = z.infer<typeof Action>;
export type ActionRow = UnionToRecord<Action>;
export const Action = z.union([
  z.object({
    type: z.enum(["followEdge"]),
    edgeId: z.lazy(() => ConvoTreeEdgeId),
  }),
  z.object({
    type: z.enum(["chat"]),
    response: z.string(),
    diffs: z.lazy(() => NpcStateDiffs),
  }),
]);

// -----------------------------------------------------------------------------
// ConvoTree
// -----------------------------------------------------------------------------

export type ConvoTree = z.infer<typeof ConvoTree>;
export const ConvoTree = z.object({
  root: z.lazy(() => ConvoTreeNodeId),
  nodes: z.record(
    z.lazy(() => ConvoTreeNodeId),
    z.lazy(() => ConvoTreeNode),
  ),
  edges: z.record(
    z.lazy(() => ConvoTreeEdgeId),
    z.lazy(() => ConvoTreeEdge),
  ),
});

export type ConvoTreeNodeId = z.infer<typeof ConvoTreeNodeId>;
export const ConvoTreeNodeId = z.string();

export type ConvoTreeEdgeId = z.infer<typeof ConvoTreeEdgeId>;
export const ConvoTreeEdgeId = z.string();

export type ConvoTreeNode = z.infer<typeof ConvoTreeNode>;
export const ConvoTreeNode = z.object({
  id: ConvoTreeNodeId,
});

export type ConvoTreeEdge = z.infer<typeof ConvoTreeEdge>;
export const ConvoTreeEdge = z.object({
  id: ConvoTreeEdgeId,
  sourceId: ConvoTreeNodeId,
  targetId: ConvoTreeNodeId.describe(
    "when this predicate is satisfied at source node, then follow this edge to the target node",
  ),
  preds: z
    .lazy(() => NpcStatePredicates)
    .describe(
      "when this edge is followed, applies this diff to the current npc state",
    ),
  diffs: z.lazy(() => NpcStateDiffs),
});

// -----------------------------------------------------------------------------
// NpcState
// -----------------------------------------------------------------------------

export type NpcState = z.infer<typeof NpcState>;
export const NpcState = z.object({
  name: z.string(),
  facts: z.array(z.string()).describe("facts that the npc knows"),
});

export type NpcStateDiffs = z.infer<typeof NpcStateDiffs>;
export type NpcStateDiffRow = UnionToRecord<NpcStateDiffs[number]>;
export const NpcStateDiffs = z.array(
  z.union([
    z.object({ type: z.enum(["learnFact"]), fact: z.string() }),
    z.object({ type: z.enum(["learnFact"]), fact: z.string() }),
  ]),
);

export type NpcStatePredicates = z.infer<typeof NpcStatePredicates>;
export type NpcStatePredicateRow = UnionToRecord<NpcStatePredicates[number]>;
export const NpcStatePredicates = z.array(
  z.union([
    z.object({ type: z.enum(["knowsFact"]), fact: z.string() }),
    z.object({ type: z.enum(["knowsFact"]), fact: z.string() }),
  ]),
);
