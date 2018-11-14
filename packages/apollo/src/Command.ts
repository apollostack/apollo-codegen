import Command, { flags } from "@oclif/command";
import * as Listr from "listr";
import { ListrTask } from "listr";
import { parse } from "path";

import {
  GraphQLProject,
  GraphQLServiceProject,
  GraphQLClientProject,
  loadConfig,
  isClientConfig,
  isServiceConfig,
  ApolloConfig,
  LoadingHandler,
  ApolloConfigFormat,
  ClientConfig
} from "apollo-language-server";
import { OclifLoadingHandler } from "./OclifLoadingHandler";

const { version, referenceID } = require("../package.json");

export interface ProjectContext<Flags = any, Args = any> {
  project: GraphQLProject;
  config: ApolloConfig;
  flags: Flags;
  args: Args;
}

const headersArrayToObject = (
  arr: string[]
): Record<string, string> | undefined => {
  if (!arr) return;
  return arr
    .map(val => JSON.parse(val))
    .reduce((pre, next) => ({ ...pre, ...next }), {});
};

const getServiceFromKey = (key): string | undefined => {
  const [type, service] = key.split(":");
  if (type === "service") return service;
  return;
};

export abstract class ProjectCommand extends Command {
  static flags = {
    config: flags.string({
      char: "c",
      description: "Path to your Apollo config file"
    }),
    header: flags.string({
      multiple: true,
      parse: header => {
        const [key, value] = header.split(":");
        return JSON.stringify({ [key.trim()]: value.trim() });
      },
      description: "Additional headers to send to server for introspectionQuery"
    }),
    endpoint: flags.string({
      description: "The url of your service"
    }),
    key: flags.string({
      description: "The API key for the Apollo Engine service",
      default: () => process.env.ENGINE_API_KEY
    }),
    engine: flags.string({
      description: "Reporting URL for a custom Apollo Engine deployment",
      hidden: true
    }),
    frontend: flags.string({
      description: "URL for a custom Apollo Engine frontend",
      hidden: true
    })
  };

  public project!: GraphQLProject;
  public tasks: ListrTask[] = [];

  protected type: "service" | "client" = "service";
  protected configMap?: (flags: any) => DeepPartial<ApolloConfig>;
  private ctx!: ProjectContext;

  async init() {
    const { flags, args } = this.parse(this.constructor as any);
    this.ctx = { flags, args } as any;

    const { config, filepath } = await this.createConfig(flags);
    this.createService(config, filepath, flags);
    (this.ctx.config = config),
      // make sure this the first item in the task list
      this.tasks.push({
        title: "Loading Apollo Project",
        task: async ctx => {
          await this.project.whenReady;
          ctx = { ...ctx, ...this.ctx };
        }
      });
  }

  protected async createConfig(flags: any) {
    let service;
    if (process.env.ENGINE_API_KEY)
      service = getServiceFromKey(process.env.ENGINE_API_KEY);
    if (flags.key) service = getServiceFromKey(flags.key);
    const loadedConfig = await loadConfig({
      configPath: flags.config,
      name: service,
      type: this.type
    });
    const { config, filepath, isEmpty } = loadedConfig!;
    if (flags.tag) config.tag = flags.tag;
    //  flag overides
    config.setDefaults({
      engine: {
        apiKey: flags.key,
        endpoint: flags.engine,
        frontend: flags.frontend
      }
    });

    if (flags.endpoint) {
      config.setDefaults({
        service: {
          endpoint: {
            url: flags.endpoint,
            headers: headersArrayToObject(flags.header)
          }
        }
      });
    }

    // load per command type defaults;
    if (this.configMap) {
      const defaults = this.configMap(flags);
      config.setDefaults(defaults);
    }

    return { config, filepath, isEmpty };
  }

  protected createService(config: ApolloConfig, filepath: string, flags: any) {
    const loadingHandler = new OclifLoadingHandler(this);
    const rootURI = `file://${parse(filepath).dir}`;
    const clientIdentity = {
      name: "Apollo CLI",
      version,
      referenceID
    };

    if (isServiceConfig(config)) {
      this.project = new GraphQLServiceProject({
        config,
        loadingHandler,
        rootURI,
        clientIdentity
      });
    } else if (isClientConfig(config)) {
      this.project = new GraphQLClientProject({
        config,
        loadingHandler,
        rootURI,
        clientIdentity
      });
    }

    this.ctx.project = this.project;
  }

  async runTasks<Result>(
    generateTasks: (context: ProjectContext) => ListrTask[]
  ): Promise<Result> {
    const tasks = await generateTasks(this.ctx!);
    return new Listr([...this.tasks, ...tasks]).run();
  }
  async catch(err) {
    // handle any error from the command
    this.error(err);
  }
  async finally(err) {
    // called after run and catch regardless of whether or not the command errored
  }
}

export abstract class ClientCommand extends ProjectCommand {
  static flags = {
    ...ProjectCommand.flags,
    clientReferenceId: flags.string({
      description:
        "Reference id for the client which will match ids from client traces, will use clientName if not provided"
    }),
    clientName: flags.string({
      description: "Name of the client that the queries will be attached to"
    }),
    clientVersion: flags.string({
      description:
        "The version of the client that the queries will be attached to"
    }),
    tag: flags.string({
      char: "t",
      description: "The published service tag for this client",
      default: "current"
    })
  };
  public project!: GraphQLClientProject;
  constructor(argv, config) {
    super(argv, config);
    this.type = "client";
    this.configMap = (flags: any) => {
      const config = {
        client: {
          name: flags.clientName,
          referenceID: flags.clientReferenceId,
          version: flags.clientVersion
        }
      } as WithRequired<DeepPartial<ApolloConfig>, "client">;
      if (flags.endpoint) {
        config.client.service = {
          url: flags.endpoint,
          headers: headersArrayToObject(flags.headers)
        };
      }
      return config;
    };
  }
}
