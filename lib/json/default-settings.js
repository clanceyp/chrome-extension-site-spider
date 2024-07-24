export default [
  {
    "title": "Extension Settings",
    "id": "section-0",
    "data": [
      {
        "help": "Request type HEAD is faster but some servers may have problems with this. Set to GET if your having trouble.",
        "options": [{"value": "GET"}, {"value": "HEAD"}],
        "label": "Request type",
        "value": "GET",
        "type": "select",
        "id": "preferredRequestType",
        "name": "preferredRequestType"
      },
      {
        "help": "Find content in the HTML markup (like a className or metadata) - method must be GET.",
        "depends": {
          "id": "preferredRequestType",
          "value": "GET"
        },
        "value": "",
        "label": "Content to find",
        "type": "textarea",
        "id": "searchTerms",
        "name": "searchTerms"
      },
      {
        "help": "Add URLs or parts of URLs you don't want to validate, e.g. 'logout'",
        "value": "logout",
        "label": "URLs to ignore (line separated list)",
        "type": "textarea",
        "id": "ignoreList",
        "name": "ignoreList"
      },
      {
        "help": "Lower number is slower, but better usually results",
        "value": 1,
        "max": 16,
        "min": 1,
        "label": "Concurrent requests",
        "type": "range",
        "id": "input-4",
        "name": "concurrentRequests"
      },
      {
        "help": "Site Spider will ignore hash differences in URLs to prevent the same URL being validated multiple times. Turn this off for if your site is using hashbangs.",
        "value": "true",
        "label": "Ignore hash in URLs",
        "type": "checkbox",
        "name": "ignoreHash",
        "id": "input-6"
      }
    ]
  }
]