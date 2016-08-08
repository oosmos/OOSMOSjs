OOSMOS.d.ts has exports to support 'import' directives
useful when using node.js.

reference_OOSMOS.d.ts has the exports removed and is useful
for use in browsers without a loader using the triple-slash reference.
To use it in a browser, use the following in your HTML:

<script type="text/javascript">
  var exports = {};  // OOSMOS will assign to exports.
</script>
<script src="built/OOSMOS.js" type="text/javascript"></script>
.
.
.
And then something like this for .js files that use OOSMOS.
<script src="oosmos user 1" type="text/javascript"></script>
<script src="oosmos user 2" type="text/javascript"></script>
.
.
.
