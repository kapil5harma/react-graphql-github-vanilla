import React, { Component } from 'react';
import Organization from './Organization';
import axios from 'axios';

const TITLE = 'React GraphQL GitHub Client';

const axiosGitHubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}`
  }
});

// const GET_ORGANIZATION = `
//   {
//     organization(login: "facebook") {
//       name
//       url
//     }
//   }
// `;

// const GET_REPOSITORY_OF_ORGANIZATION = `
//   {
//     organization(login: "facebook") {
//       name
//       url
//       repository(name: "react") {
//         name
//         url
//       }
//     }
//   }
// `;

const GET_ISSUES_OF_REPOSITORY = `
  query (
    $organization: String!,
    $repository: String!,
    $cursor: String
  ) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        stargazers {
          totalCount
        }
        viewerHasStarred
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const getIssuesOfRepository = (path, cursor) => {
  const [organization, repository] = path.split('/');
  // console.log('organization: ', organization);
  // console.log('repository: ', repository);

  return axiosGitHubGraphQL.post('', {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: { organization, repository, cursor }
  });
};

// const resolveIssuesQuery = queryResult => () => ({
//   organization: queryResult.data.data.organization,
//   errors: queryResult.data.errors
// });

const resolveIssuesQuery = (queryResult, cursor) => state => {
  const { data, errors } = queryResult.data;

  if (!cursor) {
    return {
      organization: data.organization,
      errors
    };
  }

  const { edges: oldIssues } = state.organization.repository.issues;
  const { edges: newIssues } = data.organization.repository.issues;
  const updatedIssues = [...oldIssues, ...newIssues];

  return {
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues
        }
      }
    },
    errors
  };
};

const ADD_STAR = `
  mutation ($repositoryId: ID!) {
    addStar(input:{starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

const addStarToRepository = repositoryId => {
  return axiosGitHubGraphQL.post('', {
    query: ADD_STAR,
    variables: { repositoryId }
  });
};

const resolveAddStarMutation = mutationResult => state => {
  // console.log('mutationResult: ', mutationResult);
  // console.log('state: ', state);
  const { viewerHasStarred } = mutationResult.data.data.addStar.starrable;
  let { totalCount } = state.organization.repository.stargazers;

  // console.log('viewerHasStarred: ', viewerHasStarred);
  if (viewerHasStarred === true) {
    totalCount = totalCount + 1;
  }

  return {
    ...state,
    organization: {
      ...state.organization,
      repository: {
        ...state.organization.repository,
        viewerHasStarred,
        stargazers: {
          totalCount: totalCount
        }
      }
    }
  };
};

const REMOVE_STAR = `
  mutation ($repositoryId: ID!) {
    removeStar(input:{starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

const removeStarToRepository = repositoryId => {
  return axiosGitHubGraphQL.post('', {
    query: REMOVE_STAR,
    variables: { repositoryId }
  });
};

const resolveRemoveStarMutation = mutationResult => state => {
  const { viewerHasStarred } = mutationResult.data.data.removeStar.starrable;
  let { totalCount } = state.organization.repository.stargazers;

  // console.log('viewerHasStarred: ', viewerHasStarred);
  if (viewerHasStarred === false) {
    totalCount = totalCount - 1;
  }

  return {
    ...state,
    organization: {
      ...state.organization,
      repository: {
        ...state.organization.repository,
        viewerHasStarred,
        stargazers: {
          totalCount: totalCount
        }
      }
    }
  };
};

class App extends Component {
  state = {
    path: 'facebook/react',
    organization: null,
    errors: null
  };

  componentDidMount() {
    this.onFetchFromGitHub(this.state.path);
  }

  onChange = event => {
    this.setState({ path: event.target.value });
  };

  onSubmit = event => {
    this.onFetchFromGitHub(this.state.path);
    event.preventDefault();
  };

  onFetchFromGitHub = (path, cursor) => {
    getIssuesOfRepository(path, cursor).then(queryResult =>
      this.setState(resolveIssuesQuery(queryResult, cursor))
    );
  };

  onFetchMoreIssues = () => {
    const { endCursor } = this.state.organization.repository.issues.pageInfo;

    this.onFetchFromGitHub(this.state.path, endCursor);
  };

  onStarRepository = (repositoryId, viewerHasStarred) => {
    // console.log('viewerHasStarred: ', viewerHasStarred);
    if (viewerHasStarred === false) {
      addStarToRepository(repositoryId).then(mutationResult =>
        this.setState(resolveAddStarMutation(mutationResult))
      );
    } else if (viewerHasStarred === true) {
      removeStarToRepository(repositoryId).then(mutationResult =>
        this.setState(resolveRemoveStarMutation(mutationResult))
      );
    }
  };

  render() {
    const { path, organization, errors } = this.state;
    // console.log('organization: ', organization);

    return (
      <div>
        <h1>{TITLE}</h1>

        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">Show open issues for https://github.com/</label>
          <input
            id="url"
            type="text"
            value={path}
            onChange={this.onChange}
            style={{ width: '300px' }}
          />
          <button type="submit">Search</button>
        </form>

        <hr />
        {organization ? (
          <Organization
            organization={organization}
            errors={errors}
            onFetchMoreIssues={this.onFetchMoreIssues}
            onStarRepository={this.onStarRepository}
          />
        ) : (
          <p>No information yet ...</p>
        )}
      </div>
    );
  }
}

export default App;
