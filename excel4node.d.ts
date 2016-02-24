declare module 'excel4node' {
  export interface IWorkBookOption {
    jszip?: JSZipFileOptions;

    fileSharing?: {
      userName: string;
      password: string;
    }
  }

  export interface IFont {
    size?: number;
    bold?: boolean;
    italics?: boolean;
    underline?: boolean;
    color?: string;
    font?: string;
  }

  export interface IWorkSheetOption {
    margins?: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      footer: number;
      header: number;
    }

    printOptions?: {
      centerHorizontal: boolean;
      centerVertical: boolean;
    }

    view?: {
      zoom: number;
    }

    outline?: {
      summaryBelow: boolean;
    }

    fitToPage?: {
      fitToHeight: number;
      orientation: string;
    }

    sheetProtection?: {
      autoFilter: boolean;
      deleteColumns: boolean;
      deleteRow: boolean;
      formatCells: boolean;
      formatColumns: boolean;
      formatRows: boolean;
      insertColumns: boolean;
      insertHyperlinks: boolean;
      insertRows: boolean;
      objects: boolean;
      password: string;
      pivotTables: boolean;
      scenarios: boolean;
      sheet: boolean;
      sort: boolean;
    }
  }

  export interface IArea {
    rows: {
      begin: number;
      end: number;
    }

    columns: {
      begin: number;
      end: number;
    }
  }

  // A Workbook represents an Excel document.
  export class WorkBook {
    constructor(option?: IWorkBookOption)

    WorkSheet(name?: string, option?: IWorkSheetOption): WorkSheet;

    // Set a default font for the workbook
    updateDefaultFont(font: IFont);

    write(filename: string);

    Style(): IStyle;
  }

  // A Worksheet represents a tab within an excel document.
  export class WorkSheet {
    Cell(startRow: number, startCol: number, endRow?: number, endCol?: number, isMerged?: boolean): ICell;

    // https://support.office.com/en-US/article/Set-a-specific-print-area-BEEBCEB7-0D43-4E07-8895-5AFE0AEDFB32
    printArea(area: IArea);

    // https://support.office.com/en-us/article/Repeat-specific-rows-or-columns-on-every-printed-page-0d6dac43-7ee7-4f34-8b08-ffcc8b022409
    printTitles(area: IArea);

    // Uses https://poi.apache.org/apidocs/org/apache/poi/xssf/usermodel/extensions/XSSFHeaderFooter.html
    headerFooter(options: {
      firstHeader: string;
      firstFooter: string;
      evenHeader: string;
      evenFooter: string;
      oddHeader: string;
      oddFooter: string;
    });

    Column(index: number): IColumn;
    Row(index: number): IRow;

    Image: IImage;
  }

  export interface IFreezable {
    // Freeze rows and columns
    Freeze(pos?: number): this;
  }

  export interface IHideable {
    // Hide a specific row or column
    Hide(): this;
  }

  export interface IRow extends IFreezable, IHideable {
    // Set a row to be a filter row
    Filter(startColumn?: number, endColumn?: number): this;

    // Set dimensions of rows or columns
    Height(length: number): this;

    // Set groupings on rows and optionally collapse them
    Group(level: number, isCollapsed: number): this;
  }

  export interface IColumn extends IFreezable, IHideable {
    // Set dimensions of rows or columns:
    Width(length: number): this;
  }

  export interface ICell {
    String(value: string);
    Complex(value: any[]);
    Number(value: number);
    Formula(value: string);
    Date(value: Date);
    Link(value: string, linkName?: string);
    Bool(value: boolean);

    Style(value: IStyle);
    Format: IStyle;
  }

  export interface IStyle {
    Font: {
      Bold();
      Italics();
      Underline();
      Family(value: string);
      Color(value: string);
      Size(value: number);

      Alignment: {
        Vertical(value: string);
        Horizontal(value: string);
        Rotation(value: string);
      }

      WrapText(value: boolean);
    };

    Number: {
      Format(value: string);
    };

    Fill: {
      Pattern(value: string);
      Color(value: string);
    };

    Border(
      top: { style: string; color?: string; },
      bottom: { style: string; color?: string; },
      left: { style: string; color?: string; },
      right: { style: string; color?: string; }
    )
  }

  export interface IImage {
    (path: string, type?: string): IImage;

    ABSOLUTE: string;
    ONE_CELL: string;
    TWO_CELL: string;
    Position(yPixels: number, xPixels: number): this;
    Position(row: number, column: number, offsetY?: number, offsetX?: number): this;
    Position(beginRow: number, beginColumn: number, endRow: number, endColumn: number, offsetY?: number, offsetX?: number): this;
    Size(width: number, height: number);
  }
}
