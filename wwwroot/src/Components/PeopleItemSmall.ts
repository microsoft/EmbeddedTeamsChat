import { Person } from "../Models/Person";

const template = document.createElement("template");
template.innerHTML = `
    <div class="teams-embed-people-item">
        <img class="teams-embed-people-item-img" src="" />
        <div class="teams-embed-people-item-name"></div>
    </div>`;

export class PeopleItemSmall extends HTMLElement {
    // TODO do we need onSelectedEvent?
    constructor(person: Person, onSelectedEvent: any)  {
        super();

        const dom = <HTMLElement>template.content.cloneNode(true);
        (<HTMLElement>dom.querySelector(".teams-embed-people-item")).id = person.id;
        (<HTMLImageElement>dom.querySelector(".teams-embed-people-item-img")).src = person.photo;
        (<HTMLElement>dom.querySelector(".teams-embed-people-item-name")).innerText = person.displayName;
        if (onSelectedEvent) {
            (<HTMLElement>dom.querySelector(".teams-embed-people-item")).addEventListener("click", onSelectedEvent);
        }
        this.appendChild(dom);
    };

    refresh = (person: Person) => {
        (<HTMLImageElement>this.querySelector(".teams-embed-people-item-img")).src = person.photo;
        (<HTMLElement>this.querySelector(".teams-embed-people-item-name")).innerText = person.displayName;
    };
}

customElements.get("people-item-small") || customElements.define("people-item-small", PeopleItemSmall);