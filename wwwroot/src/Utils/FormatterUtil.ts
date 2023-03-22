
export class FormatterUtil {
    
  private static splitMessageContent(html: string): any[] {
    // Create an array to store the resulting objects
    const result: any[] = [];
  
    // Use a regular expression to match all HTML tags and plain text in the input string
    const matches = html.match(/(<[^>]+>|[^<]+)/g);
    if (!matches) {
      return result;
    }
    // Iterate over the matches
    for (const match of matches) {
      // Check if the match is a tag or plain text
      if (match.startsWith('<')) {
        // Use a regular expression to extract the tag name from the full tag string
        //const tagName = match.match(/^<\/?([^\s>]+)/)[1];
        const matchedValue = match.match(/^<\/?([^\s>]+)/);
        if (matchedValue) { 
          // Add a new object to the result array with the tag name as type and the full tag string as the value
          result.push({ type: matchedValue[1], content: match });
        }
      } else {
        // Add a new object to the result array with the type "text" and the plain text as the value
        result.push({ type: 'text', content: match });
      }
    }
  
    return result;
  }

    static formatMessageBody(message: string): any {
                
        //Create array of chat message words
        var chatMessage: string[];
        chatMessage = [];
        //Create array of mention message words
        var mentions: any[];
        mentions = [];
        var mentionCount = -1;
        const messageParts = this.splitMessageContent(message);
        //Fill array of messages and mentions
        for (let i = 0; i < messageParts.length; i++) {
          if (messageParts[i].type !== 'readonly') {
            //The messagePart is text or html
            chatMessage.push(messageParts[i].content);
          } 
          else {
            // The messagePart is a readonly tag containing the data from the user mentioned
            mentionCount = mentionCount + 1;
            
            //Push mention person message to chatMessage array
            chatMessage.push("%MentionPerson%-" + mentionCount);
            var mentionPerson = {
              id: mentionCount,
              mentionText: messageParts[i + 1].content,
              mentioned: {
                user: {
                  displayName: messageParts[i + 1].content,
                  id: messageParts[i].content.substring(
                    messageParts[i].content.indexOf('userid="') + 8,
                    messageParts[i].content.indexOf('userid="') + 44
                  ),
                  userIdentityType: "aadUser",
                },
              },
            };
            //Push mention person details to mentions array
            mentions.push(mentionPerson);
            i = i + 2;
          }
        }
      
        //define payload
        var payloads: any;
        //Create payload if there is no mention in message
        if (mentions.length == 0) {
          payloads = {
            body: {
              contentType: "html",
              content: chatMessage.join(""),
            },
          };
        }
        //Create payload if there is  mention in message
        else {
          
          var finalMessage: string[];
          finalMessage = [];
          //Process each chat message
          for (let i = 0; i < chatMessage.length; i++) {
            //check if message is for mention if yes, then replace MentionPerson-<index> with actual value from mention array
            if (chatMessage[i].indexOf("%MentionPerson%-") != -1) {
              var index = chatMessage[i].split(/[-]/g);
              var tempStr = `<at id=${index[1]}>${
                mentions[Number(index[1])].mentioned.user.displayName
              }</at>`;
              finalMessage.push(tempStr);
            }
            //If no mention then no change in message
            else {
              finalMessage.push(chatMessage[i]);
            }
          }
      
          //create final payload
          payloads = {
            body: {
              contentType: "html",
              content: finalMessage.join(""),
            },
            mentions: mentions,
          };
        }
       return payloads;
      }
}