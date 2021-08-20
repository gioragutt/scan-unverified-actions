import * as core from '@actions/core';
import {
  checkVerification,
  parseWorkflowFiles,
  readWorkflows,
  VerificationResult,
} from './utils';

const outputMapping: Record<VerificationResult, string> = {
  verified: 'verified-actions',
  unverified: 'unverified-actions',
  'custom-action': 'custom-actions',
  'not-found': 'unknown-actions',
};

async function main() {
  const workflowsPath = core.getInput('workflows-dir');

  console.log();
  console.log('🔎 Scanning for unverified actions', workflowsPath);
  console.log();

  const workflows = await readWorkflows(workflowsPath);

  if (!workflows.length) {
    core.setFailed(`No workflows found in ${workflowsPath}`);
    return;
  }

  console.log(
    '📆 Found workflows',
    workflows.map(w => w.filename)
  );
  console.log();

  const {actionNames, actionsToJobs} = parseWorkflowFiles(workflows);

  const categorized = await actionNames.reduce(async (acc, name) => {
    const output = await acc;
    const result = await checkVerification(name);
    output[result] = output[result] ?? [];
    output[result].push(name);
    return output;
  }, Promise.resolve({} as Partial<Record<VerificationResult, string[]>>));

  console.log('📊 Scanner result summary:');

  for (const [category, outputName] of Object.entries(outputMapping)) {
    const actions = categorized[category as VerificationResult];
    const message = actions ? actions.join(', ') : 'no such actions';
    console.log(` - ${`${outputName}:`.padEnd(19)}`, message);
  }

  console.log();

  if (categorized.unverified) {
    console.log('❌ Found unverified actions', categorized.unverified);
    console.log();

    const tableData = categorized.unverified.flatMap(action =>
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

  core.setOutput('found-unverified-actions', !!categorized.unverified);
  for (const [category, outputName] of Object.entries(outputMapping)) {
    core.setOutput(outputName, categorized[category] ?? []);
  }
}

main().catch(err => {
  core.setFailed(err.message);
});
