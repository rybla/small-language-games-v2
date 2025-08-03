"use server";

import { Endpoint, InstMetadata, Spec } from "@/library/sva";
import { Server } from "@/library/sva-server";
import { Codomain, Domains, match } from "@/utility";
import { ActionRow, ConvoTree, name, NpcState, S, State } from "./common";
import * as flow from "./flow";
import {
  getConvoTreeEdgesFromNode,
  getCurrentConvoTreeNode,
  runNpcStateDiff,
  runNpcStateDiff as runNpcStateDiffs,
} from "./semantics";

// -----------------------------------------------------------------------------
// initializeState
// -----------------------------------------------------------------------------

async function initializeState_sellPizzaAndSalad(
  metadata: InstMetadata,
  params: S["params_initialize"],
): Promise<State> {
  const objective_sellPizza =
    "Convince the user to buy a pizza. Make sure that the user _explicitly_ agrees to buy a pizza.";
  const objective_sellSalad =
    "Convince the user to buy a salad. Make sure that the user _explicitly_ agrees to buy a salad.";

  const npcState: NpcState = {
    name: "Benny",
    description: "Benny is a professional chef with a passion for cooking.",
    facts: ["Benny owns a restaurant."],
    mood: "neutral",
    objectives: [objective_sellPizza],
  };

  const nodes = {
    sellingPizza: { id: "sellingPizza" },
    sellingSalad: { id: "sellingSalad" },
    done: { id: "done" },
  } satisfies ConvoTree["nodes"];

  const edges = {
    sellPizza: {
      id: "sellPizza",
      sourceId: nodes.sellingPizza.id,
      targetId: nodes.sellingSalad.id,
      preds: [
        {
          type: "knowsFact",
          fact: "The user has agreed to buy a pizza.",
        },
      ],
      diffs: [
        { type: "completeObjective", objective: objective_sellPizza },
        { type: "addObjective", objective: objective_sellSalad },
      ],
    },
    sellSalad: {
      id: "sellSalad",
      sourceId: nodes.sellingSalad.id,
      targetId: nodes.done.id,
      preds: [
        {
          type: "knowsFact",
          fact: "The user has agreed to buy a salad.",
        },
      ],
      diffs: [{ type: "completeObjective", objective: objective_sellSalad }],
    },
  } satisfies ConvoTree["edges"];

  return {
    turns: [],
    npcState: npcState,
    currentId: nodes.sellingPizza.id,
    convoTree: {
      root: nodes.sellingPizza.id,
      nodes,
      edges,
    },
  } satisfies State;
}

// -----------------------------------------------------------------------------
// spec
// -----------------------------------------------------------------------------

const spec: Spec<S> = {
  name,
  initializeState: initializeState_sellPizzaAndSalad,
  async view(metadata, turns, state) {
    return {
      state,
      turns,
    };
  },
  async generateActions(turns, state, params) {
    return [{ type: "pass" }];
  },
  async interpretAction(state, params, action) {
    const { diffs } = await flow.GenerateNpcStateDiffs({
      state,
      prompt: params.prompt,
    });
    await runNpcStateDiff(diffs, state.npcState);

    const node = getCurrentConvoTreeNode(state);
    const edges = getConvoTreeEdgesFromNode(state.convoTree, node.id);
    for (const edge of edges) {
      const edgeIsSatisfied = await flow.InterpretNpcStatePredicates({
        state: state.npcState,
        preds: edge.preds,
      });
      if (edgeIsSatisfied) {
        state.currentId = edge.targetId;
        await runNpcStateDiffs(edge.diffs, state.npcState);
      }
    }

    await match<ActionRow, Promise<void>>(action, {
      async pass(x) {},
    });

    const { response } = await flow.GenerateNpcResponse({
      state,
      prompt: params.prompt,
    });
    state.turns.push({ params, response });
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
