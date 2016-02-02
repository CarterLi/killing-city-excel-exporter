declare module 'node-fetch' {
  var fetch: typeof window.fetch;

  export = fetch;
}
