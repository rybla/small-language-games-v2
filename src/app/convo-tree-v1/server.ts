/* eslint-disable @typescript-eslint/no-unused-vars */

"use server";

import { Endpoint, Spec } from "@/library/sva";
import { Server } from "@/library/sva-server";
import { Codomain, do_, Domains, TODO } from "@/utility";
import { S, name } from "./common";
import * as flow from "./flow";
import {
  getConvoTreeEdgesFromNode,
  getCurrentConvoTreeNode,
} from "./semantics";

const spec: Spec<S> = {
  name,
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
    return {};
  },
  async generateActions(state, params) {
    const node = getCurrentConvoTreeNode(state);
    const edges = getConvoTreeEdgesFromNode(state.convoTree, node.id);
    const edge = await do_(async () => {
      for (const edge of edges) {
        const edgeIsSatisfied = await flow.InterpretNpcStatePredicates({
          state: state.npcState,
          preds: edge.preds,
        });
        if (edgeIsSatisfied) {
          return edge;
        }
      }
      return undefined;
    });
    return [
      {
        edgeId: edge?.id,
      },
    ];
  },
  async interpretAction(state, params, action) {
    return;
  },
};

const server = new Server(spec);

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
