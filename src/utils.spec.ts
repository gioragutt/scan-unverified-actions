import {
  isUnverifiedAction,
  readWorkflows,
  parseWorkflowFiles,
  ParseWorkflowFilesOutput,
} from './utils';
import mockFs from 'mock-fs';
import {readFileSync} from 'fs';
import {WorkflowFile} from './types';

describe('isUnverifiedAction=false', () => {
  it.each([
    'actions/setup-go-environment',
    'actions/first-interaction',
    'actions/cache',
    'actions/upload-a-build-artifact',
    'actions/download-a-build-artifact',
    'actions/setup-net-core-sdk',
    'actions/close-stale-issues',
    'actions/setup-node-js-environment',
    'actions/setup-node',
  ])('%s', async action => {
    expect(await isUnverifiedAction(action)).toBe(false);
  });
});

describe('isUnverifiedAction=true', () => {
  it.each(['gioragutt/scan-unverified-actions'])('%s', async action => {
    expect(await isUnverifiedAction(action)).toBe(true);
  });
});

describe('readWorkflows', () => {
  afterEach(() => mockFs.restore());

  it('no such dir', async () => {
    mockFs({
      'not-workflows': {},
    });

    await expect(readWorkflows('.github/workflows')).rejects.toBeTruthy();
  });

  it('empty directory', async () => {
    mockFs({
      '.github/workflows': {},
    });

    expect(await readWorkflows('.github/workflows')).toEqual([]);
  });

  it('valid file', async () => {
    mockFs({
      '.github/workflows': {
        'flow.yml': mockFs.bypass(() =>
          readFileSync('.github/workflows/main.yml', 'utf-8')
        ),
      },
    });

    const workflows = await readWorkflows('.github/workflows');
    expect(workflows.length).toBe(1);
    expect(workflows[0]).toMatchObject({
      filename: 'flow.yml',
      content: {
        jobs: {
          job: {
            steps: expect.any(Array),
          },
        },
      },
    });
  });
});

describe('parseWorkflowFiles', () => {
  it('test', () => {
    const workflows: WorkflowFile[] = [
      {
        filename: 'a.yml',
        content: {
          jobs: {
            jobA: {
              steps: [{uses: 'action1'}, {uses: 'action2'}],
            },
            jobB: {
              steps: [{uses: 'action2'}, {uses: 'action3'}],
            },
          },
        },
      },
      {
        filename: 'b.yml',
        content: {
          jobs: {
            jobA: {
              steps: [{uses: 'action3'}, {uses: 'action4'}],
            },
            jobB: {
              steps: [{uses: 'action4'}, {uses: 'action1'}],
            },
          },
        },
      },
    ];

    expect(
      parseWorkflowFiles(workflows)
    ).toStrictEqual<ParseWorkflowFilesOutput>({
      actionNames: ['action1', 'action2', 'action3', 'action4'],
      jobsToActions: [
        [{filename: 'a.yml', job: 'jobA'}, ['action1', 'action2']],
        [{filename: 'a.yml', job: 'jobB'}, ['action2', 'action3']],
        [{filename: 'b.yml', job: 'jobA'}, ['action3', 'action4']],
        [{filename: 'b.yml', job: 'jobB'}, ['action4', 'action1']],
      ],
      actionsToJobs: {
        action1: [
          {filename: 'a.yml', job: 'jobA'},
          {filename: 'b.yml', job: 'jobB'},
        ],
        action2: [
          {filename: 'a.yml', job: 'jobA'},
          {filename: 'a.yml', job: 'jobB'},
        ],
        action3: [
          {filename: 'a.yml', job: 'jobB'},
          {filename: 'b.yml', job: 'jobA'},
        ],
        action4: [
          {filename: 'b.yml', job: 'jobA'},
          {filename: 'b.yml', job: 'jobB'},
        ],
      },
    });
  });
});
