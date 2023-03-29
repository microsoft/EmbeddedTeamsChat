const adaptiveCardMessage = (chatDescription: string) => {
  const adaptiveCardTemplate = {
    body: {
      contentType: "html",
      content:
        '<attachment id=\"adaptive34aa4a7fb74e2b300012card\"></attachment>',
    },
    attachments: [
      {
        id: "adaptive34aa4a7fb74e2b300012card",
        contentType: "application/vnd.microsoft.card.adaptive",
        content: chatDescription,
      },
    ],
  };

  return JSON.stringify(adaptiveCardTemplate);
};

module.exports = {adaptiveCardMessage};
