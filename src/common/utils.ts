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

export const excludeColumns = <T extends object>(EntityClass: new () => T, exclude: string[]): (keyof T)[] => {
  const entityInstance = new EntityClass();
  const allColumns = Object.keys(entityInstance) as (keyof T)[];
  return allColumns.filter(column => !exclude.includes(column as string));
};