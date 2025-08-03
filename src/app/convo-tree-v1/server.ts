"use server";

import { Endpoint, Spec } from "@/library/sva";
import { Server } from "@/library/sva-server";
import { Codomain, Domains, match } from "@/utility";
import { Action, ActionRow, name, S } from "./common";
import * as flow from "./flow";
import {
  getConvoTreeEdge,
  getConvoTreeEdgesFromNode,
  getCurrentConvoTreeNode,
  runNpcStateDiff as runNpcStateDiffs,
} from "./semantics";

const spec: Spec<S> = {
  name,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async initializeState(metadata, params) {
    return {
      currentId: "node1",
      convoTree: {
        root: "node1",
        nodes: {
          node1: {
            id: "node1",
          },
          node2: {
            id: "node2",
          },
        },
        edges: {
          edge1: {
            id: "edge1",
            sourceId: "node1",
            targetId: "node2",
            preds: [{ type: "knowsFact", fact: "the sky is blue" }],
            diffs: [],
          },
        },
      },
      npcState: {
        name: "Benny",
        facts: [],
      },
    } satisfies S["state"];
  },
  async view(metadata, turns, state) {
    return {
      state,
      turns: turns.map((turn) => ({
        params: turn.params,
        actions: turn.actions,
      })),
    };
  },
  async generateActions(state, params) {
    const node = getCurrentConvoTreeNode(state);
    const edges = getConvoTreeEdgesFromNode(state.convoTree, node.id);
    for (const edge of edges) {
      const edgeIsSatisfied = await flow.InterpretNpcStatePredicates({
        state: state.npcState,
        preds: edge.preds,
      });
      if (edgeIsSatisfied) {
        const { response, diffs } = await flow.GenerateNpcResponse({ state });
        return [
          { type: "followEdge", edgeId: edge.id },
          { type: "chat", response, diffs },
        ] satisfies Action[];
      }
    }
    const { response, diffs } = await flow.GenerateNpcResponse({ state });
    return [{ type: "chat", response, diffs }] satisfies Action[];
  },
  async interpretAction(state, params, action) {
    await match<ActionRow, Promise<void>>(action, {
      async followEdge(x) {
        const edge = getConvoTreeEdge(state.convoTree, x.edgeId);
        state.currentId = edge.targetId;
      },
      async chat(x) {
        await runNpcStateDiffs(x.diffs, state.npcState);
      },
    });
  },
};

const server = new Server(spec);

// -----------------------------------------------------------------------------
// BEGIN endpoint

const endpoint_impl = server.make_endpoint();

export async function endpoint<K extends keyof Endpoint<S>>(
  key: K,
  ...args: Domains<Endpoint<S>[K]>
): Promise<Codomain<Endpoint<S>[K]>> {
  const f = endpoint_impl;
  // @ts-expect-error apparently type checker can't substitute keys properly
  return await f[key](...args);
}

// END endpoint
// -----------------------------------------------------------------------------
