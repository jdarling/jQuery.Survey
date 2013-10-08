jQuery.Survey
=========

jQuery.Survey is a JSON based Survey plugin for jQuery.  It was inspired by a few other plugins I found that could render multi-page survey type forms that have long been abandoned.  It is fully functional as is, but there will be updates to it to include a designer and documentation.

Basically I wanted a multi-page survey that could be stored in JSON so I could put it into MongoDB or a standard JSON file and have the UI display it.

My basic requirements were:
  * Must be able to show/hide sections based on data entered
  * Conditions should have the ability to be complex
  * Must use a template system (default is handlebars)
  * Must be extensible (you can add new template types, override existing templates easily, change template engines, hook page changes, and even change the transition effects)
  * Must support required fields and validation

Usage - Basics
-----------------

Include it in your page after jQuery:
    <script type="text/javascript" src="js/jQuery.Survey.js"></script>

Create a survey object:
```js
var survey = {
};
```

Initialize and use your survey:
```js
$('#survey').survey({
  survey: survey,
  data: yourData
});
```

Or to load the survey data or survey from a URL:
```js
$('#survey').survey({
  surveyURL: surveyURL,
  dataURL: yourDataURL
});
```

See example\index.html for more details until better documentation is written.  The example makes use of Handlebars and jQuery.Validate.
