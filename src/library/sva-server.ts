import { stat_safe } from "@/utility_fs";
import Paths from "./paths";
import { Endpoint, Inst, InstMetadata, Sig, Spec } from "./sva";
import * as fs from "fs/promises";
import path from "path";
import { try_ } from "@/utility";

// -----------------------------------------------------------------------------
// Server
// -----------------------------------------------------------------------------

export class Server<S extends Sig> {
  paths = new Paths("public");
  inst: Inst<S> | null = null;

  constructor(public spec: Spec<S>) {}

  async getInstMetadatas(): Promise<InstMetadata[]> {
    const dirpath = this.paths.rootDirpath(this.spec.name);
    fs.mkdir(dirpath, { recursive: true });
    const filenames = await fs.readdir(dirpath);
    const mds: InstMetadata[] = [];
    for (const filename of filenames) {
      if ((await stat_safe(path.join(dirpath, filename)))?.isDirectory()) {
        const inst_id = filename;
        const md_filepath = this.paths.instMetadataFilepath(
          this.spec.name,
          inst_id,
        );
        const md_data = await try_(
          () => fs.readFile(md_filepath, "utf8"),
          (error) => {
            throw new Error(
              `Failed to read metadata file: ${md_filepath}. ${error}`,
            );
          },
        );
        const md = await try_(
          () => JSON.parse(md_data),
          (error) => {
            throw new Error(
              `Failed to parse metadata file: ${md_filepath}. ${error}`,
            );
          },
        );
        mds.push(md);
      }
    }
    return mds;
  }

  async loadInst(id: string): Promise<void> {
    throw new Error("Function not implemented.");
  }

  async saveInst(name?: string): Promise<void> {
    throw new Error("Function not implemented.");
  }

  async getView(): Promise<S["view"]> {
    throw new Error("Function not implemented.");
  }

  async act(params: S["params_action"]): Promise<void> {
    throw new Error("Function not implemented.");
  }

  make_endpoint(): Endpoint<S> {
    return {
      getInstMetadatas: () => this.getInstMetadatas(),
    };
  }
}
