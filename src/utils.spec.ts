import {readFileSync} from 'fs';
import mockFs from 'mock-fs';
import {WorkflowFile} from './types';
import {
  checkVerification,
  parseWorkflowFiles,
  ParseWorkflowFilesOutput,
  readWorkflows,
} from './utils';

describe('checkVerification', () => {
  test.each`
    action                                                       | result
    ${'definitely/not-a-real-github-action'}                     | ${'not-found'}
    ${'gioragutt/ngx-plugin-modules'}                            | ${'not-found'}
    ${'actions/setup-node-js-environment'}                       | ${'verified'}
    ${'actions/setup-node'}                                      | ${'verified'}
    ${'gioragutt/scan-unverified-actions'}                       | ${'unverified'}
    ${'angular/dev-infra/github-actions/breaking-changes-label'} | ${'custom-action'}
  `(`$action is $result`, async ({action, result}) => {
    expect(await checkVerification(action)).toBe(result);
  });
});

describe('readWorkflows', () => {
  afterEach(() => mockFs.restore());

  test('no such dir', async () => {
    mockFs({
      'not-workflows': {},
    });

    await expect(readWorkflows('.github/workflows')).rejects.toBeTruthy();
  });

  test('empty directory', async () => {
    mockFs({
      '.github/workflows': {},
    });

    expect(await readWorkflows('.github/workflows')).toEqual([]);
  });

  test('valid file', async () => {
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
          ci: {
            steps: expect.any(Array),
          },
          sanity: {
            steps: expect.any(Array),
          },
        },
      },
    });
  });
});

describe('parseWorkflowFiles', () => {
  test('parse correctly', () => {
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
