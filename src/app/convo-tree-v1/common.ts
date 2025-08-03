import { Sig } from "@/library/sva";
import { Subtype } from "@/utility";
import { z } from "genkit";

// -----------------------------------------------------------------------------
// S
// -----------------------------------------------------------------------------

export const name = "convo-tree-v1" as const;

export type S = Subtype<
  {
    name: typeof name;
    params_initialize: { prompt: string };
    params_action: { prompt: string };
    state: State;
    view: View;
    action: Action;
  },
  Sig
>;

export type State = z.infer<typeof State>;
export const State = z.object({
  convoTree: z.lazy(() => ConvoTree),
  currentId: z.lazy(() => ConvoTreeNodeId),
  npcState: z.lazy(() => NpcState),
});

export type View = z.infer<typeof View>;
export const View = z.object({});

export type Action = z.infer<typeof Action>;
export const Action = z.object({});

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
  pred: z
    .lazy(() => NpcStatePredicate)
    .describe(
      "when this edge is followed, applies this diff to the current npc state",
    ),
  diff: z.lazy(() => NpcStateDiff),
});

// -----------------------------------------------------------------------------
// NpcState
// -----------------------------------------------------------------------------

export type NpcState = z.infer<typeof NpcState>;
export const NpcState = z.object({
  name: z.string(),
  facts: z.array(z.string()).describe("facts that the npc knows"),
});

export type NpcStateDiff = z.infer<typeof NpcStateDiff>;
export const NpcStateDiff = z.array(
  z.union([
    z.object({ type: z.enum(["learnFact"]), fact: z.string() }),
    z.object({ type: z.enum(["learnFact"]), fact: z.string() }),
    z.object({ type: z.enum(["learnFact"]), fact: z.string() }),
  ]),
);

export type NpcStatePredicate = z.infer<typeof NpcStatePredicate>;
export const NpcStatePredicate = z.array(
  z.union([
    z.object({ type: z.enum(["knowsFact"]), fact: z.string() }),
    z.object({ type: z.enum(["knowsFact"]), fact: z.string() }),
    z.object({ type: z.enum(["knowsFact"]), fact: z.string() }),
  ]),
);
