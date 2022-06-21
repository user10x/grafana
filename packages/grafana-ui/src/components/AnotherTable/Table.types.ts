export type TableField = {
  id: string;
  name: string;
  values: any[];
  // TODO: fix typing here
  render?: (value: any) => any;
};

export type TableData = {
  fields: TableField[];
};
