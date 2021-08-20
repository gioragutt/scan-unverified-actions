import * as core from '@actions/core';
import * as github from '@actions/github';
import {promises as fs} from 'fs';
import {load} from 'js-yaml';
import fetch from 'node-fetch';
import {join} from 'path';

const WORKFLOWS = './github/workflows';

interface WorkflowFile {
  filename: string;
  content: {
    name?: string;
    on: any;
    jobs: Record<
      string,
      {
        name: string;
        steps: {
          name: string;
          uses?: string;
          id?: string;
          run?: string;
        }[];
      }
    >;
  };
}

async function readWorkflows() {
  const files = await fs.readdir(WORKFLOWS);
  const workflows = files.filter(
    f => f.endsWith('.yaml') || f.endsWith('.yml')
  );
  return await workflows.reduce(async (acc, filename) => {
    const output = await acc;
    const content = load(
      await fs.readFile(join(WORKFLOWS, filename), 'utf-8')
    ) as WorkflowFile['content'];
    output.push({
      filename,
      content,
    });
    return output;
  }, Promise.resolve([] as WorkflowFile[]));
}

async function isUnverifiedAction(action: string) {
  const actionName = action.split('@')[0];

  const html = await fetch(`https://github.com/marketplace/${actionName}`).then(
    r => r.text()
  );

  return !html.includes('GitHub has verified that this action was created by');
}

async function main() {
  console.log(
    `🔎 Scanning for unverified actions in ${github.context.repo.owner}/${github.context.repo.repo}`
  );

  const workflows = await readWorkflows();

  console.log(
    '📆 Found workflows',
    workflows.map(w => w.filename)
  );

  const actionNames = [
    ...new Set(
      workflows.flatMap(({content}) =>
        Object.values(content.jobs)
          .flatMap(({steps}) => steps.map(s => s.uses))
          .filter(action => action && !action.startsWith('./'))
      )
    ),
  ];

  console.log('🛠 Found actions', actionNames);

  const unverifiedActions = await actionNames.reduce(async (acc, name) => {
    const output = await acc;
    if (await isUnverifiedAction(name)) {
      output.push(name);
    }
    return output;
  }, Promise.resolve([] as string[]));

  if (unverifiedActions.length) {
    console.log('❌ Found unverified actions', unverifiedActions);
  } else {
    console.log('✅ No unverified actions found!');
  }

  core.setOutput('found-verified-actions', unverifiedActions.length > 0);
  core.setOutput('unverified-actions', unverifiedActions);
}

main().catch(err => {
  core.setFailed(err.message);
});
