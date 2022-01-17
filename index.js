const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('token');
    const projectId = core.getInput('projectId');
    const issueId = core.getInput('issueId');
    const fieldId = core.getInput('fieldId');
    const value = core.getInput('value');

    const octokit = github.getOctokit(token);
    await octokit.graphql(
      `
      mutation ($project: ID!, $item: ID!, $fieldId: ID!, $fieldValue: String!) {
        updateProjectNextItemField(
          input: {
            projectId: $project
            itemId: $item
            fieldId: $fieldId
            value: $fieldValue
          }
        )
        {
          projectNextItem {
            id
          }
        }
      }
    `,
      {
        project: projectId,
        item: issueId,
        fieldId: fieldId,
        fieldValue: value
      },
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
