export const paramsQueryBuilder = (params: Record<string, unknown>): void => {
    console.log("params", params);
    const queryStringArray: string[] = [];
    const keys = Object.keys(params);
    let fullQuery: string;
    keys.forEach(key => {
        const query = `(job.parameters->>'${key}') = :${key}`;
        queryStringArray.push(query);
    });
    
    if (queryStringArray.length > 0) {
        fullQuery = queryStringArray.join(" AND ")
    }
    return fullQuery;




}