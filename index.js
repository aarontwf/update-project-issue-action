const core = require('@actions/core');
const github = require('@actions/github');

const getProjectDetails = async (octokit, organization, projectNumber) => {
  const response = await octokit.graphql(
    `
      query($organization: String!, $projectNumber: Int!) {
        organization(login: $organization) {
          projectNext(number: $projectNumber) {
            id
            title

            fields(first: 50) {
              nodes {
                id
                name
              }
            }
            
            items(first: 50) {
              nodes {
                id
                title
              }
            }
          }
        }
      }
    `,
    {
      organization: organization,
      projectNumber: projectNumber,
    },
  );
  console.log(JSON.stringify(response));
  return response.data.organization.projectNext;
};

const setField = async (octokit, projectId, itemId, fieldId, fieldValue) => {
  await octokit.graphql(
    `
      mutation ($project: ID!, $item: ID!, $field: ID!, $value: String!) {
        updateProjectNextItemField(
          input: {
            projectId: $project
            itemId: $item
            fieldId: $field
            value: $value
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
      item: itemId,
      fieldId: fieldId,
      fieldValue: fieldValue
    },
  );
};

async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const organization = core.getInput('organization', { required: true });
    const projectNumber = core.getInput('projectNumber', { required: true });
    const itemName = core.getInput('issue', { required: true });
    const fieldName = core.getInput('field', { required: true });
    const value = core.getInput('value', { required: true });

    const octokit = github.getOctokit(token);

    console.log(`Retrieving details for ${organization} project ${projectNumber}`);
    const project = await getProjectDetails(octokit, organization, projectNumber);
    console.log(`Updating project "${project.title}"`);

    const field = project.fields.nodes.find((it) => it.name === fieldName)
      ?? throw Error(`Field "${fieldName}" not found`);

    const item = project.items.nodes.find((it) => it.name === itemName)
      ?? throw Error(`Item "${itemName}" not found`);

    console.log(`${project.title} / ${item.title} / ${field.name} = ${value}`);
    await setField(octokit, project.id, item.id, field.id, value);
    console.log('Field updated!');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
