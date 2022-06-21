import { useState } from 'react';
import { lastValueFrom } from 'rxjs';

import { Correlation, DataSourceInstanceSettings } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';

import { addCorrelation, deleteCorrelation } from './api';

const havingCorrelations = (ds: DataSourceInstanceSettings) => ds.correlations.length >= 1;

const getCorrelations = () => getDataSourceSrv().getList().filter(havingCorrelations);

export const useCorrelations = () => {
  const [correlations, setCorrelations] = useState(getCorrelations());

  const reload = async () => {
    await getDataSourceSrv().reload();
    setCorrelations(getCorrelations());
  };

  const add = (sourceUid: string, correlation: Correlation) => {
    return lastValueFrom(addCorrelation(sourceUid, correlation)).then(reload);
  };

  const remove = (sourceUid: string, targetUid: string) => {
    return lastValueFrom(deleteCorrelation(sourceUid, targetUid)).then(reload);
  };

  return { correlations, add, remove };
};
