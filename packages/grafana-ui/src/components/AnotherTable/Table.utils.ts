import { TableData } from './Table.types';

// Returns the columns in a "react-table" acceptable format
export function getColumns(data: TableData) {
  return data.fields.map((field) => ({
    Header: field.name,
    accessor: field.id,
    Cell: ({ value }: { value: any }) => (field.render ? field.render(value) : String(value)),
  }));
}

// Transforms our format to the following ("react-table" compatible) data format:
// ("col1" and "col2" are the IDs of the fields)
// [
//   {
//     col1: 'Hello',
//     col2: 'World',
//   },
//   {
//     col1: 'react-table',
//     col2: 'rocks',
//   },
//   {
//     col1: 'whatever',
//     col2: 'you want',
//   },
// ]
export function getData(data: TableData) {
  const rowCounts = data.fields.map(({ values }) => values.length || 0);
  const maxRowCount = Math.max(...rowCounts);
  const rows = [];

  for (let index = 0; index < maxRowCount; index++) {
    const row = data.fields.reduce(
      (prev, current) => ({
        ...prev,
        [current.id]: current.values[index] || null,
      }),
      {}
    );

    rows.push(row);
  }

  return rows;
}
