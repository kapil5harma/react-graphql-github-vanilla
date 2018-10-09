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

const getIssuesOfRepositoryQuery = (organization, repository) => {
  // console.log('organization: ', organization);
  // console.log('repository: ', repository);

  return `
  {
    organization(login: "${organization}") {
      name
      url
      repository(name: "${repository}") {
        name
        url
        issues(last: 5) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
    }
  }
`;
};

const getIssuesOfRepository = path => {
  const [organization, repository] = path.split('/');
  // console.log('organization: ', organization);
  // console.log('repository: ', repository);

  return axiosGitHubGraphQL.post('', {
    query: getIssuesOfRepositoryQuery(organization, repository)
  });
};

const resolveIssuesQuery = queryResult => () => ({
  organization: queryResult.data.data.organization,
  errors: queryResult.data.errors
});

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

  onFetchFromGitHub = path => {
    getIssuesOfRepository(path).then(queryResult =>
      this.setState(resolveIssuesQuery(queryResult))
    );
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
          <Organization organization={organization} errors={errors} />
        ) : (
          <p>No information yet ...</p>
        )}
      </div>
    );
  }
}

export default App;
