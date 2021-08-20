import * as core from '@actions/core';
import {isUnverifiedAction, parseWorkflowFiles, readWorkflows} from './utils';

async function main() {
  const workflowsPath = core.getInput('workflows-dir');

  console.log('🔎 Scanning for unverified actions', workflowsPath);

  const workflows = await readWorkflows(workflowsPath);

  console.log(
    '📆 Found workflows',
    workflows.map(w => w.filename)
  );

  const {actionNames, actionsToJobs} = parseWorkflowFiles(workflows);

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
    console.log();

    const tableData = unverifiedActions.flatMap(action =>
      actionsToJobs[action].flatMap(({filename, job}) => ({
        action,
        workflow: filename,
        job,
      }))
    );

    console.table(tableData);
  } else {
    console.log('✅ No unverified actions found!');
  }

  core.setOutput('found-verified-actions', unverifiedActions.length > 0);
  core.setOutput('unverified-actions', unverifiedActions);
}

main().catch(err => {
  core.setFailed(err.message);
});
