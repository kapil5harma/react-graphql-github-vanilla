import React from 'react';
import Issues from './Issues';

const Repository = ({ repository, onFetchMoreIssues, onStarRepository }) => {
  // console.log('repository: ', repository);
  return (
    <div>
      <p>
        <strong>In Repository: </strong>
        <a href={repository.url}>{repository.name}</a>
      </p>

      <button
        type="button"
        onClick={() =>
          onStarRepository(repository.id, repository.viewerHasStarred)
        }
      >
        {repository.stargazers.totalCount}
        {repository.viewerHasStarred ? ' Unstar' : ' Star'}
      </button>

      <Issues issues={repository.issues} />
      <hr />
      {repository.issues.pageInfo.hasNextPage && (
        <button onClick={onFetchMoreIssues}>More</button>
      )}
    </div>
  );
};

export default Repository;
