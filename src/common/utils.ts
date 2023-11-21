export const paramsQueryBuilder = (params: Record<string, unknown>): string => {
    const queryStringArray: string[] = [];
    const paramKeys = Object.keys(params);
    let fullQuery = '';

    paramKeys.forEach(key => {
        const query = `(job.parameters->>'${key}') = :${key}`;
        queryStringArray.push(query);
    });
    
    if (queryStringArray.length > 0) {
        fullQuery = queryStringArray.join(" AND ")
    }
    return fullQuery;
}
