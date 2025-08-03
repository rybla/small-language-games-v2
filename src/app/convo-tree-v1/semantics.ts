import { ticks } from "@/utility";
import {
  ConvoTree,
  ConvoTreeEdge,
  ConvoTreeEdgeId,
  ConvoTreeNode,
  ConvoTreeNodeId,
  NpcState,
  NpcStateDiff,
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

export function runNpcStateDiff(d: NpcStateDiff, s: NpcState) {
  for (const x of d) {
  }
}
