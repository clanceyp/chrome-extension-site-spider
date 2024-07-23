export default [
  {
    "title": "Extension Settings",
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
        "help": "Find a word or HTML snippet in destination pages - method must be GET.",
        "value": "",
        "label": "Content to find",
        "type": "textarea",
        "id": "input-2",
        "name": "searchTerm"
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
        "help": "Lower number is slower, but better results",
        "value": 1,
        "max": 16,
        "min": 1,
        "label": "Concurrent requests",
        "type": "range",
        "id": "input-4",
        "name": "concurrentRequests"
      },
      {
        "help": "Check local links only",
        "value": "true",
        "label": "Only validate links within the current domain",
        "type": "checkbox",
        "name": "localLinksOnly",
        "id": "input-5"
      },
      {
        "help": "Link audit ignores hash differences in URLs to prevent the same URL being validated multiple times",
        "value": "true",
        "label": "Ignore hash in URLs ",
        "type": "checkbox",
        "name": "ignoreHash",
        "id": "input-6"
      },
      {
        "help": "By default 40x are all reported as errors, to ignore permissions add comma separated list of status codes e.g. 401, 403",
        "value": "",
        "label": "Consider response valid",
        "type": "text",
        "id": "input-7",
        "name": "input-7"
      }
    ],
    "id": "section-0"
  }
]