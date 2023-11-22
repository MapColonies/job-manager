import { paramsQueryBuilder } from '../../../src/common/utils';

describe('paramsQueryBuilder', () => {
  it('should be matched to the expected query string with 1 param', function () {
    const params = { id: 1 };
    const expectedQueryString = `(job.parameters->>'id') = :id`;
    const res = paramsQueryBuilder(params);

    expect(res).toEqual(expectedQueryString);
  });

  it('should be matched to the expected query string with multi params', function () {
    const params = { id: 1, crs: 'epsg:4326', roi: 'roi' };
    const expectedQueryString = `(job.parameters->>'id') = :id AND (job.parameters->>'crs') = :crs AND (job.parameters->>'roi') = :roi`;
    const res = paramsQueryBuilder(params);

    expect(res).toEqual(expectedQueryString);
  });
});
