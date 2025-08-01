import { stat_safe } from "@/utility_fs";
import Paths from "./paths";
import { Endpoint, Inst, InstMetadata, Sig, Spec } from "./sva";
import * as fs from "fs/promises";
import path from "path";
import { deepcopy, stringify, try_ } from "@/utility";
import { randomUUID } from "crypto";

// -----------------------------------------------------------------------------
// Server
// -----------------------------------------------------------------------------

export class Server<S extends Sig> {
  paths = new Paths("public");
  inst: Inst<S> | null = null;

  constructor(public spec: Spec<S>) {}

  // ----------------

  make_endpoint(): Endpoint<S> {
    return {
      initializeState: (params) => this.initializeInst(params),
      getInstMetadatas: () => this.getInstMetadatas(),
      actInst: (params) => this.actInst(params),
      getInstView: () => this.getInstView(),
      loadInst: (id) => this.loadInst(id),
      saveInst: (name) => this.saveInst(name),
    };
  }

  // ----------------

  async initializeInst(params: S["params_initialize"]): Promise<InstMetadata> {
    const id = randomUUID();
    const metadata: InstMetadata = {
      id,
      name: id,
      creationDate: Date.now(),
    };
    const initialState = await this.spec.initializeState(metadata, params);
    this.inst = {
      metadata,
      initialState,
      state: initialState,
      turns: [],
    };
    return metadata;
  }

  async getInstMetadatas(): Promise<InstMetadata[]> {
    const dirpath = this.paths.rootDirpath(this.spec.name);
    await fs.mkdir(dirpath, { recursive: true });
    return (
      await Promise.all(
        (await fs.readdir(dirpath)).map(async (filename) => {
          if (!(await stat_safe(path.join(dirpath, filename)))?.isDirectory())
            return [];
          const inst_id = filename;
          const md_filepath = this.paths.instMetadataFilepath(
            this.spec.name,
            inst_id,
          );
          const md_raw = await try_(
            () => fs.readFile(md_filepath, "utf8"),
            (error) => {
              throw new Error(
                `Failed to read metadata file ${md_filepath}: ${error}`,
              );
            },
          );
          const md: InstMetadata = await try_(
            () => JSON.parse(md_raw),
            (error) => {
              throw new Error(
                `Failed to parse metadata file ${md_filepath}: ${error}`,
              );
            },
          );
          return [md];
        }),
      )
    ).flat();
  }

  async loadInst(id: string): Promise<void> {
    const inst_filepath = this.paths.instFilepath(this.spec.name, id);
    await fs.mkdir(path.dirname(inst_filepath), { recursive: true });
    const inst_raw = await try_(
      () => fs.readFile(inst_filepath, "utf8"),
      (error) => {
        throw new Error(
          `Failed to read instance file ${inst_filepath}: ${error}`,
        );
      },
    );
    const inst = try_(
      () => JSON.parse(inst_raw),
      (error) => {
        throw new Error(
          `Failed to parse instance file ${inst_filepath}: ${error}`,
        );
      },
    );
    this.inst = inst;
  }

  async saveInst(name?: string): Promise<void> {
    if (this.inst === null) return;
    if (name !== undefined) {
      this.inst.metadata.name = name;
    }
    const inst_filepath = this.paths.instFilepath(
      this.spec.name,
      this.inst.metadata.id,
    );
    const instMetadata_filepath = this.paths.instMetadataFilepath(
      this.spec.name,
      this.inst.metadata.id,
    );

    await Promise.all([
      fs.mkdir(path.dirname(inst_filepath), { recursive: true }),
      fs.writeFile(inst_filepath, JSON.stringify(this.inst, null, 2)),
      fs.mkdir(path.dirname(instMetadata_filepath), { recursive: true }),
      fs.writeFile(
        instMetadata_filepath,
        JSON.stringify(this.inst.metadata, null, 2),
      ),
    ]);
  }

  async getInstView(): Promise<S["view"]> {
    if (this.inst === null)
      throw new Error("[server.getView] Instance not loaded");
    return await this.spec.view(
      this.inst.metadata,
      this.inst.turns,
      this.inst.state,
    );
  }

  /**
   * Interpretation is sequential, so the interpretation of subsequent actions
   * uses the state that has been modified by preceeding action interpretations.
   */
  async actInst(params: S["params_action"]): Promise<void> {
    if (this.inst === null) throw new Error("[server.act] Instance not loaded");
    const state = deepcopy(this.inst.state);
    const view = await this.getInstView();
    const actions = await this.spec.generateActions(this.inst.state, params);
    for (const action of actions) {
      await this.spec.interpretAction(this.inst.state, params, action);
    }
    this.inst.turns.push({
      actions,
      view,
      params,
      state,
    });

    console.log(stringify(this.inst.turns));
  }
}
