"use server";

import { Endpoint, Spec } from "@/library/sva";
import { Server } from "@/library/sva-server";
import { Codomain, Domains, match } from "@/utility";
import { Action, ActionRow, ConvoTree, name, S } from "./common";
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
    const nodes = {
      node1: { id: "node1" },
      node2: { id: "node2" },
    } satisfies ConvoTree["nodes"];

    const edges = {
      edge1: {
        id: "edge1",
        sourceId: nodes.node1.id,
        targetId: nodes.node2.id,
        preds: [{ type: "knowsFact", fact: "the user is a gardener" }],
        diffs: [{ type: "learnFact", fact: 'the password is "genie123"' }],
      },
    } satisfies ConvoTree["edges"];

    return {
      turns: [],
      currentId: nodes.node1.id,
      convoTree: {
        root: nodes.node1.id,
        nodes,
        edges,
      },
      npcState: {
        name: "Benny",
        description: "Benny is a professional chef with a passion for cooking.",
        facts: ["I know the best recipe for pizza."],
        mood: "neutral",
        objectives: ["I want to convince the user to buy pizzas from me."],
      },
    } satisfies S["state"];
  },
  async view(metadata, turns, state) {
    return {
      state,
      turns,
    };
  },
  async generateActions(turns, state, params) {
    const node = getCurrentConvoTreeNode(state);
    const edges = getConvoTreeEdgesFromNode(state.convoTree, node.id);
    console.log(`[generateActions] edges: ${edges.map((edge) => edge.id)}`);
    for (const edge of edges) {
      console.log(`[InterpretNpcStatePredicates] considering edge ${edge.id}`);
      const edgeIsSatisfied = await flow.InterpretNpcStatePredicates({
        state: state.npcState,
        preds: edge.preds,
      });
      if (edgeIsSatisfied) {
        const { response, diffs } = await flow.GenerateNpcResponse({
          state,
          prompt: params.prompt,
        });
        return [
          { type: "followEdge", edgeId: edge.id },
          { type: "respond", response },
          { type: "diffs", diffs },
        ] satisfies Action[];
      }
    }
    const { response, diffs } = await flow.GenerateNpcResponse({
      state,
      prompt: params.prompt,
    });
    return [
      { type: "respond", response },
      { type: "diffs", diffs },
    ] satisfies Action[];
  },
  async interpretAction(state, params, action) {
    await match<ActionRow, Promise<void>>(action, {
      async followEdge(x) {
        const edge = getConvoTreeEdge(state.convoTree, x.edgeId);
        state.currentId = edge.targetId;
        await runNpcStateDiffs(edge.diffs, state.npcState);
      },
      async respond(x) {
        state.turns.push({ params, response: x.response });
      },
      async diffs(x) {
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
