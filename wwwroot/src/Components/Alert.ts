import { AlertAction } from "../Models/AlertAction";

const template = document.createElement("template");
template.innerHTML = `
<div class="app-notification-banner" style="display: none;">
  <div class="app-notification-container">
    <span class="app-notification-text"></span>
    <span class="app-notification-action"></span>
  </div>
  <span class="app-notification-dismiss-action"></span>
</div>`

export class Alert extends HTMLElement {
  constructor()  {
      super();
      this.render();
  }

  dismiss = () => {
    (<HTMLElement>this.querySelector(".app-notification-banner")).style.display = "none";
    (<HTMLElement>this.querySelector(".app-notification-text")).innerText = "";
    (<HTMLElement>this.querySelector(".app-notification-action")).innerText = "";
  }

  show = (message: string, action?: AlertAction) => {
    (<HTMLElement>this.querySelector(".app-notification-text")).innerText = message;
    (<HTMLElement>this.querySelector(".app-notification-banner")).style.display = "flex";

    // action was passed into the alert
    if (action) {
      const actionElement = (<HTMLElement>this.querySelector(".app-notification-action"));
      // set the action text 
      actionElement.innerText = action.content;
      // wire up the callback
      actionElement.addEventListener("click", () => {
        action.callback().then(() => {
          // after the callback action finishes
          // check to see if we should dismiss the alert
          if (action.dismissAlert) {
            this.dismiss();
          }
        })
      });
    }
  }

  render = () => {
    const dom = <HTMLElement>template.content.cloneNode(true);
    (<HTMLElement>dom.querySelector(".app-notification-dismiss-action")).addEventListener('click', () => {
      this.dismiss();
    });

    this.appendChild(dom);
  }
}

customElements.define("app-alert", Alert);