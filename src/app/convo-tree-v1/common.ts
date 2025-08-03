/* eslint-disable @typescript-eslint/no-empty-object-type */

import { Sig } from "@/library/sva";
import { Subtype, TODO } from "@/utility";
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
    state: {
      convoTree: ConvoTree;
      npcState: NpcState;
    };
    view: TODO;
    action: TODO;
  },
  Sig
>;

// -----------------------------------------------------------------------------
// ConvoTree
// -----------------------------------------------------------------------------

export type ConvoTree = {
  root: ConvoTreeNodeId;
  nodes: Record<ConvoTreeNodeId, ConvoTreeNode>;
  edges: Record<ConvoTreeEdgeId, ConvoTreeEdge>;
};
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

export type ConvoTreeNodeId = string;
export const ConvoTreeNodeId = z.string();

export type ConvoTreeEdgeId = string;
export const ConvoTreeEdgeId = z.string();

export type ConvoTreeNode = {
  id: ConvoTreeNodeId;
};
export const ConvoTreeNode = z.object({
  id: ConvoTreeNodeId,
});

export type ConvoTreeEdge = {
  id: ConvoTreeEdgeId;
  kidIds: ConvoTreeNodeId[];
  /**
   * when this predicate is satisfied, then follow this edge
   */
  pred: NpcStatePredicate;
  /**
   * when this edge is followed, applies this diff to the current npc state
   */
  diff: NpcStateDiff;
};
export const ConvoTreeEdge = z.object({
  id: ConvoTreeEdgeId,
  kidIds: z.array(ConvoTreeNodeId),
  pred: z.lazy(() => NpcStatePredicate),
  diff: z.lazy(() => NpcStateDiff),
});

// -----------------------------------------------------------------------------
// NpcState
// -----------------------------------------------------------------------------

export type NpcState = {
  name: string;
  /**
   * facts that the npc knows
   */
  knowledge: string[];
};
export const NpcState = z.object({
  name: z.string(),
  knowledge: z.array(z.string()),
});

export type NpcStateDiff = {};
export const NpcStateDiff = z.object({});

// TODO: defunctionalize
export type NpcStatePredicate = (s: NpcState) => boolean;
export const NpcStatePredicate = z
  .function()
  .args(NpcState)
  .returns(z.boolean());
