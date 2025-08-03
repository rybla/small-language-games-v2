import { match, ticks } from "@/utility";
import type {
  ConvoTree,
  ConvoTreeEdge,
  ConvoTreeEdgeId,
  ConvoTreeNode,
  ConvoTreeNodeId,
  NpcState,
  NpcStateDiffs,
  NpcStateDiffRow,
  State,
} from "./common";

export function getConvoTreeNode(
  ct: ConvoTree,
  id: ConvoTreeNodeId,
): ConvoTreeNode {
  if (!Object.keys(ct.nodes).includes(id))
    throw new Error(`ConvoTreeNode with id ${ticks(id)} not found`);
  return ct.nodes[id];
}

export function getConvoTreeEdge(
  ct: ConvoTree,
  id: ConvoTreeEdgeId,
): ConvoTreeEdge {
  if (!Object.keys(ct.edges).includes(id))
    throw new Error(`ConvoTreeEdge with id ${ticks(id)} not found`);
  return ct.edges[id];
}

export function getCurrentConvoTreeNode(s: State): ConvoTreeNode {
  return getConvoTreeNode(s.convoTree, s.currentId);
}

export function getConvoTreeEdgesFromNode(
  ct: ConvoTree,
  id: ConvoTreeNodeId,
): ConvoTreeEdge[] {
  return Array.from(Object.values(ct.edges).filter((e) => e.sourceId === id));
}

export async function runNpcStateDiff(ds: NpcStateDiffs, s: NpcState) {
  for (const d of ds) {
    await match<NpcStateDiffRow, Promise<void>>(d, {
      async learnFact(x) {
        s.facts.push(x.fact);
      },
    });
  }
}
