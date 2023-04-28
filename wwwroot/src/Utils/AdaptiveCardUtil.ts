export class AdaptiveCardMessage {
  static adaptiveCardMessage = (adaptiveCard: string) => {
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
        content: adaptiveCard,
      },
    ],
  };

  return JSON.stringify(adaptiveCardTemplate);
};
}