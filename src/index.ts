import * as core from '@actions/core';
import {isUnverifiedAction, parseWorkflowFiles, readWorkflows} from './utils';

async function main() {
  const workflowsPath = core.getInput('workflows-dir');

  core.info(`🔎 Scanning for unverified actions in ${workflowsPath}`);

  const workflows = await readWorkflows(workflowsPath);

  core.debug(
    `📆 Found workflows: ${workflows.map(w => w.filename).join(', ')}`
  );

  const {actionNames, actionsToJobs} = parseWorkflowFiles(workflows);

  core.debug(`🛠 Found actions: ${actionNames.join(', ')}`);

  const unverifiedActions = await actionNames.reduce(async (acc, name) => {
    const output = await acc;
    if (await isUnverifiedAction(name)) {
      output.push(name);
    }
    return output;
  }, Promise.resolve([] as string[]));

  if (unverifiedActions.length) {
    core.info(`❌ Found unverified actions: ${unverifiedActions.join(', ')}`);
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
    console.info('✅ No unverified actions found!');
  }

  core.setOutput('found-verified-actions', unverifiedActions.length > 0);
  core.setOutput('unverified-actions', unverifiedActions);
}

main().catch(err => {
  core.setFailed(err.message);
});
