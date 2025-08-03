/* eslint-disable @typescript-eslint/no-unused-vars */

"use server";

import { Endpoint, Spec } from "@/library/sva";
import { Server } from "@/library/sva-server";
import { Codomain, Domains } from "@/utility";
import { S, name } from "./common";

const spec: Spec<S> = {
  name,
  async initializeState(metadata, params) {
    return { counter: 0 };
  },
  async view(metadata, turns, state) {
    return {}; // TODO
  },
  async generateActions(state, params) {
    return []; //TODO
  },
  async interpretAction(state, params, action) {
    return; // TODO
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
