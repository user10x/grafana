import { fieldExtractors, FieldExtractorID } from './fieldExtractors';

describe('Extract fields from text', () => {
  it('JSON extractor', async () => {
    const extractor = fieldExtractors.get(FieldExtractorID.JSON);
    const out = extractor.parse('{"a":"148.1672","av":41923755,"c":148.25}');

    expect(out).toMatchInlineSnapshot(`
      Object {
        "a": "148.1672",
        "av": 41923755,
        "c": 148.25,
      }
    `);
  });

  it('Split key+values', async () => {
    const extractor = fieldExtractors.get(FieldExtractorID.KeyValues);
    const out = extractor.parse('a="1",   "b"=\'2\',c=3  x:y ;\r\nz="7"');
    expect(out).toMatchInlineSnapshot(`
      Object {
        "a": "1",
        "b": "2",
        "c": "3",
        "x": "y",
        "z": "7",
      }
    `);
  });

  it('Split URL style parameters', async () => {
    const extractor = fieldExtractors.get(FieldExtractorID.KeyValues);
    const out = extractor.parse('a=b&c=d&x=123');
    expect(out).toMatchInlineSnapshot(`
      Object {
        "a": "b",
        "c": "d",
        "x": "123",
      }
    `);
  });

  it('Prometheus labels style (not really supported)', async () => {
    const extractor = fieldExtractors.get(FieldExtractorID.KeyValues);
    const out = extractor.parse('{foo="bar", baz="42"}');
    expect(out).toMatchInlineSnapshot(`
      Object {
        "baz": "42",
        "foo": "bar",
      }
    `);
  });

  it('Misformed data', async () => {
    const extractor = fieldExtractors.get(FieldExtractorID.KeyValues);
    let out = extractor.parse('a="1');
    expect(out).toMatchInlineSnapshot(`
      Object {
        "a": "1",
      }
    `);

    out = extractor.parse('a=');
    expect(out).toMatchInlineSnapshot(`
      Object {
        "a": "",
      }
    `);

    //????? GOOD OR BAD ??????
    out = extractor.parse('no key value pairs');
    expect(out).toMatchInlineSnapshot(`
      Object {
        "no": "key",
        "value": "pairs",
      }
    `);
  });

  it('Test key-values with single/double quotes', async () => {
    const extractor = fieldExtractors.get(FieldExtractorID.KeyValues);
    const out = extractor.parse('a="1",   "b"=\'2\',c=3  x:y ;\r\nz="d and 4"');
    expect(out).toMatchInlineSnapshot(`
      Object {
        "a": "1",
        "b": "2",
        "c": "3",
        "x": "y",
        "z": "d and 4",
      }
    `);
  });

  it('Test key-values with nested single/double quotes', async () => {
    const extractor = fieldExtractors.get(FieldExtractorID.KeyValues);
    const out = extractor.parse(`z="dbl_quotes=\\"Double Quotes\\" sgl_quotes='Single Quotes'"`);

    expect(out).toMatchInlineSnapshot(`
      Object {
        "z": "dbl_quotes=\\"Double Quotes\\" sgl_quotes='Single Quotes'",
      }
    `);
  });
});
