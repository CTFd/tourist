# Rendering PDFs from HTML

Tourist can render PDFs from provided HTML without the need to visit a page. Rendering is always **Synchronous**.

### Authentication

If you're running Tourist with authentication enabled, you will need to obtain a visit token to schedule requests.
This is covered in the [authentication](02-authentication.md) section.

Any valid tourist token will work for rendering PDFs, and scope is ignored.

### Usage

You can render HTML to PDF by submitting a `POST` request to `/api/v1/render`.

The complete payload for this request looks like this:

```json5
{
  // html is the only required property - it's the markup that should be rendered 
  "html": "<your html here>",
  "format": "A4", // page format - optional, defaults to A4 (for a full list of supported formats, see the playwright docs on PDF rendering)
  "landscape": false, // whether the page should be rendered in landscape mode (horizontal) - optional, defaults to false (portrait / vertical)
  "background": true, // whether the page should be rendered with background color / images for elements - optional, defaults to true
  "margin": { // page margins - optional, default to 0
    "top": "10px", // values can be as supported by CSS, either numbers or strings with units
    "right": "10px",
    "bottom": "10px",
    "left": "10px"
  },
  "size": { // page size - optional, defaults to an empty object. Format will take precedence over size.
    "width": "10px",
    "height": "10px"
  },
  "js": true, // whether to execute JS on the page - optional, defaults to true
  "delay": 1000, // delay in ms before rendering the page (to allow js execution) - optional, defaults to 0 - will be ignored if js is false, max 30 seconds
  "scale": 1.0, // page scale - optional, defaults to 1.0, max 2.0
}
```

An example can be found in the [examples directory](examples/rendering-html-to-pdf.py).
