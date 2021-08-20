import {promises as fs} from 'fs';
import {load} from 'js-yaml';
import fetch from 'node-fetch';
import {join} from 'path';
import {WorkflowFile, WorkflowSyntax} from './types';

const isRelativePathRegex = /^(.\/|..\/)+/;

const viewOnMarketplaceRegex =
  /<a.*href="\/marketplace\/(.*)".*>View on Marketplace<\/a>/;

const isValidResponse = (status: number) => status >= 200 && status < 300;

export type VerificationResult =
  | 'verified'
  | 'unverified'
  | 'not-found'
  | 'custom-action';

async function checkActionOnMarketplace(
  action: string
): Promise<VerificationResult> {
  const marketplaceResponse = await fetch(
    `https://github.com/marketplace/${action}`
  );

  if (!isValidResponse(marketplaceResponse.status)) {
    return 'not-found';
  }

  const html = await marketplaceResponse.text();

  return html.includes('GitHub has verified that this action was created by')
    ? 'verified'
    : 'unverified';
}

export async function checkVerification(
  actionName: string
): Promise<VerificationResult> {
  if (
    actionName.split('/').length > 2 ||
    isRelativePathRegex.test(actionName)
  ) {
    return 'custom-action';
  }

  const marketplaceCheck = await checkActionOnMarketplace(actionName);

  if (marketplaceCheck !== 'not-found') {
    return marketplaceCheck;
  }

  const repoResponse = await fetch(`https://github.com/${actionName}`);
  if (!isValidResponse(repoResponse.status)) {
    return 'not-found';
  }

  const html = await repoResponse.text();
  const [, realActionName] = html.match(viewOnMarketplaceRegex) ?? [];

  if (!realActionName) {
    return 'not-found';
  }

  return await checkActionOnMarketplace(realActionName);
}

export async function readWorkflows(path: string) {
  const files = await fs.readdir(path);

  const workflows = files.filter(
    f => f.endsWith('.yaml') || f.endsWith('.yml')
  );

  return await workflows.reduce(async (acc, filename) => {
    const output = await acc;
    const content = load(
      await fs.readFile(join(path, filename), 'utf-8')
    ) as WorkflowSyntax;

    output.push({
      filename,
      content,
    });
    return output;
  }, Promise.resolve([] as WorkflowFile[]));
}

export interface ParseWorkflowFilesOutput {
  actionNames: string[];
  actionsToJobs: Record<
    string,
    {
      filename: string;
      job: string;
    }[]
  >;
  jobsToActions: [
    {
      filename: string;
      job: string;
    },
    string[]
  ][];
}

export function parseWorkflowFiles(
  workflows: WorkflowFile[]
): ParseWorkflowFilesOutput {
  const jobsToActions = workflows.reduce((acc, {filename, content}) => {
    for (const [job, {steps = []}] of Object.entries(content.jobs || {})) {
      const actions = [];
      for (const {uses} of steps) {
        if (uses) {
          actions.push(uses.split('@')[0]);
        }
      }
      if (actions.length) {
        acc.push([{filename, job}, actions]);
      }
    }
    return acc;
  }, [] as [{filename: string; job: string}, string[]][]);

  const actionsToJobs = jobsToActions.reduce((acc, [job, actions]) => {
    for (const action of actions) {
      if (!acc[action]) {
        acc[action] = [];
      }
      acc[action].push(job);
    }
    return acc;
  }, {} as Record<string, {filename: string; job: string}[]>);

  const actionNames = Object.keys(actionsToJobs);

  return {actionNames, actionsToJobs, jobsToActions};
}
