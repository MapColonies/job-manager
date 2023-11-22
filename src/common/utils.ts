// TODO: need to support nested paremeters, currently only 1 level is supported
export const paramsQueryBuilder = (params: Record<string, unknown>): string => {
  const queryStringArray: string[] = [];
  const paramKeys = Object.keys(params);
  let fullQuery = '';

  paramKeys.forEach((key) => {
    const query = `(job.parameters->>'${key}') = :${key}`;
    queryStringArray.push(query);
  });

  if (queryStringArray.length > 0) {
    fullQuery = queryStringArray.join(' AND ');
  }
  return fullQuery;
};
