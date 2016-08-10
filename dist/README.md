## Using `OOSMOS.d.ts`

### With a Module Loader

`OOSMOS.d.ts` has `export` directives.  Use this when building for `node.js` or an environment that has a module loader.

### Without a Module Loader

If you aren't using a module loader (e.g. a browser), use file `reference_OOSMOS.d.ts`, which is simply `OOSMOS.d.ts` with the exports removed, like this.

#### `browser.ts`
```
/// <reference path='typings/reference_OOSMOS.d.ts' />
.
. Your TypeScript code that uses `OOSMOS`.
.
```

#### `index.html`
To the use the transpiled JavaScript in a browser, use the following in your HTML:

```
.
.
.
<script type="text/javascript">
  var exports = {};  // OOSMOS will assign to exports.
</script>
<script src="dist/OOSMOS.js" type="text/javascript"></script>
.
.
.
<script src="dist/browser.js" type="text/javascript"></script>
.
.
.
```
