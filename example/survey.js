var survey = {
  title: 'signup',
  name: 'signup',
  pages: [
    {
      name: 'generalinfo',
      title: 'Signup',
      elements: [
        {
          name: "firstName",
          type: 'text',
          label: "First Name",
          placeholder: "Your First Name...",
          required: true
        },
        {
          name: "lastName",
          type: 'text',
          label: "Last Name",
          placeholder: "Your Last Name...",
          required: true
        },
        {
          name: "email",
          type: 'email',
          label: "Email Address",
          placeholder: "Your Email Address...",
          required: true
        },
        {
          name: "gender",
          type: 'radio',
          label: "Gender:",
          options: [
            {
              key: 'male',
              value: 'Male'
            },
            {
              key: 'female',
              value: 'Female'
            }
          ],
          required: true
        },
        {
          type: 'section',
          condition: {
            from: {elem: "[name=gender]:checked"},
            to: 'female'
          },
          elements: [
            {
              type: 'html',
              fragment: '<p>Girls rule!</p>'
            }
          ]
        },
        {
          type: 'section',
          condition: {
            from: {elem: "[name=gender]:checked"},
            to: 'male'
          },
          elements: [
            {
              type: 'html',
              fragment: '<p>Guys rule!</p>'
            }
          ]
        }
      ],
      options: [
        {
          type: 'nextPage',
          caption: 'Signup >'
        }
      ]
    },
    {
      name: "thanks",
      elements: [
        {
          type: 'handlebars',
          source: '<p>{{data.firstName}}, thanks for your interest.</p>'
        }
      ],
    }
  ]
};
