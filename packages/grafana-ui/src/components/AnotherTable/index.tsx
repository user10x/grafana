import { cx, css } from '@emotion/css';
import React, { useMemo } from 'react';
import { useTable } from 'react-table';

import { GrafanaTheme2 } from '@grafana/data';

import { useStyles2 } from '../../themes';

import { TableData } from './Table.types';
import { getData, getColumns } from './Table.utils';

const getStyles = (theme: GrafanaTheme2) => ({
  table: css`
    border-radius: ${theme.shape.borderRadius()};
    border: solid 1px ${theme.colors.border.weak};
    background-color: ${theme.colors.background.secondary};

    th,
    td {
      padding: ${theme.spacing(1)};
    }
  `,
  row: css``,
  oddRow: css`
    background: ${theme.colors.background.primary};
  `,
  evenRow: css``,
});

type Props = {
  data: TableData;
  className?: string;
  thClassName?: string;
  tdClassName?: string;
};

export const AnotherTable = ({ data, className, thClassName, tdClassName }: Props) => {
  const styles = useStyles2(getStyles);
  const tableData = useMemo(() => getData(data), [data]);
  const tableColumns = useMemo(() => getColumns(data), [data]);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns: tableColumns,
    data: tableData,
  });

  return (
    <table {...getTableProps()} className={cx(styles.table, className)}>
      {/* Header */}
      <thead>
        {headerGroups.map((headerGroup) => (
          // .getHeaderGroupProps() will return with a key as well, so the <tr> will actually have a key.
          // eslint-disable-next-line react/jsx-key
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              // .getHeaderProps() will return with a key as well, so the <th> will actually have a key.
              // eslint-disable-next-line react/jsx-key
              <th {...column.getHeaderProps()} className={thClassName}>
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>

      {/* Body */}
      <tbody {...getTableBodyProps()}>
        {rows.map((row, rowIndex) => {
          prepareRow(row);

          return (
            // .getRowProps() will return with a key as well, so the <tr> here will actually have a key.
            // eslint-disable-next-line react/jsx-key
            <tr {...row.getRowProps()} className={cx(styles.row, rowIndex % 2 ? styles.evenRow : styles.oddRow)}>
              {row.cells.map((cell) => {
                return (
                  // .getCellProps() will return with a key as well, so the <td> here will actually have a key.
                  // eslint-disable-next-line react/jsx-key
                  <td {...cell.getCellProps()} className={cx(tdClassName)}>
                    {cell.render('Cell')}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
