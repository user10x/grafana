import { css, cx } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { AnotherTable, Button, DeleteButton, HorizontalGroup, useStyles2 } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import Page from 'app/core/components/Page/Page';

import { useNavModel } from '../../core/hooks/useNavModel';

import { AddCorrelationForm } from './AddCorrelationForm';
import { useCorrelations } from './useCorrelations';

// FIXME: this is copied over from alerting, and we are using these styles potentially
// in a bunch of different places, maybe move to @grafana/ui?
const getStyles = (theme: GrafanaTheme2) => ({
  root: css`
    margin-top: 1rem;
    width: 100%;
    border-radius: ${theme.shape.borderRadius()};
    border: solid 1px ${theme.colors.border.weak};
    background-color: ${theme.colors.background.secondary};

    th {
      padding: ${theme.spacing(1)};
    }

    td {
      padding: 0 ${theme.spacing(1)};
    }

    tr {
      height: 38px;
    }
  `,
  oddRow: css`
    background-color: ${theme.colors.background.primary};
  `,

  // Actual styles
  table: css`
    width: 100%;
  `,
});

export default function CorrelationsPage() {
  const navModel = useNavModel('correlations');
  const [isAdding, setIsAdding] = useState(false);
  const styles = useStyles2(getStyles);
  const { correlations, add, remove } = useCorrelations();

  console.log(correlations);

  return (
    <>
      <Page navModel={navModel}>
        <Page.Contents>
          {correlations.length === 0 && !isAdding && (
            <EmptyListCTA
              title="You haven't defined any correlation yet."
              buttonIcon="sitemap"
              onClick={() => setIsAdding(true)}
              buttonTitle="Add correlation"
            />
          )}

          {correlations.length >= 1 && (
            <div>
              <HorizontalGroup justify="space-between">
                <div>
                  <h4>Correlations</h4>
                  <p>description</p>
                </div>
                <Button icon="plus" onClick={() => setIsAdding(true)} disabled={isAdding}>
                  Add new
                </Button>
              </HorizontalGroup>
            </div>
          )}

          <AddCorrelationForm onClose={() => setIsAdding(false)} show={isAdding} onSubmit={add} />

          {correlations.length >= 1 && (
            <>
              <AnotherTable
                data={{ fields: [{ id: 'source', name: 'Source', values: [] }] }}
                className={styles.table}
              />
              <table className={styles.root}>
                <thead>
                  <tr>
                    <th>Source Datasource</th>
                    <th>Target Datasource</th>
                    <th>Label</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {correlations.map((ds, i) =>
                    ds.correlations.map((correlation, j) => (
                      <tr
                        className={cx({ [styles.oddRow]: (i + j) % 2 === 0 })}
                        key={`${ds.uid}-${correlation.target}`}
                      >
                        <td>
                          <img src={ds.meta.info.logos.small} height={12} />
                          {ds.name}
                        </td>
                        <td>
                          <img
                            src={getDataSourceSrv().getInstanceSettings(correlation.target)?.meta.info.logos.small}
                            height={12}
                          />
                          {getDataSourceSrv().getInstanceSettings(correlation.target)?.name}
                        </td>
                        <td></td>
                        <td>
                          <DeleteButton onConfirm={() => remove(ds.uid, correlation.target)} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </Page.Contents>
      </Page>
    </>
  );
}
