declare module 'excel-export' {
  export interface ColumnConfig {
    caption: string;
    type: string; // 'string' | 'date' | 'bool' | 'number';
    beforeCellWrite?: (row, cellData, eOpt: {
      rowNum: number;
      styleIndex: number;
      cellType: string;
    }) => any;
    width?: number;
  }

  export interface ExecuteConfig {
    stylesXmlFile?: string;
    cols: ColumnConfig[];
    rows: any[];
  }

  export function execute(conf: ExecuteConfig);
}
