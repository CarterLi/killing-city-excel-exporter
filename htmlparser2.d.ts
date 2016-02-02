declare module 'htmlparser2' {
  export class DomHandler {
    constructor(
      callback?: (err: NodeJS.ErrnoException, dom: Array<any>) => void,
      options?: {
        normalizeWhitespace?: boolean,
        withDomLvl1?: boolean,
        withStartIndices?: boolean
      });
  }

  export interface Parser {
    constructor(handler: DomHandler);
  }
}

declare module 'DomUtils' {

  class inner {
    find(test: (node: any) => void, elems: Array<any>): void
  }

  var exports: inner;

  export = exports;
}
