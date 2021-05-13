import parseDate from '../parseDate';
describe('parseDate()', () => {
  it('should return 1514674800000', () => {
    const value = '12/31/2017';
    const expected = 1514646000000; // 1514678400000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return 1514678400000', () => {
    const value = '2017-12-31';
    const expected = 1514678400000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return 1514743200000', () => {
    const value = '2017-12-31T18:00:00Z';
    const expected = 1514743200000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return 1514739600000', () => {
    const value = '2017-12-31 18:00:00';
    const expected = 1514710800000; // 1514743200000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return 1514707200000', () => {
    const value = 'Sun Dec 31 2017 00:00:00 GMT-0800 (Pacific Standard Time)';
    const expected = 1514707200000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return 1514674800000', () => {
    const value = 'Sunday, December 31, 2017';
    const expected = 1514646000000; // 1514678400000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return 1514743200000', () => {
    const value = 'Sun, 31 Dec 2017 18:00:00 GMT';
    const expected = 1514743200000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return 1514739600000', () => {
    const value = 'Sunday, December 31, 2017 6:00:00 PM';
    const expected = 1514710800000; // 1514743200000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return 1514743200000', () => {
    const value = 'Sun, 31 Dec 2017 18:00:00 GMT';
    const expected = 1514743200000;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return undefined', () => {
    const value = 'abc';
    const expected = undefined;
    expect(parseDate(value)).toEqual(expected);
  });
  it('should return undefined', () => {
    const value = '2018-12-40';
    const expected = undefined;
    expect(parseDate(value)).toEqual(expected);
  });
});