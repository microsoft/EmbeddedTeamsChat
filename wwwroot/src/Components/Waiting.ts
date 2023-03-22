const template = document.createElement("template");
template.innerHTML = `
    <div class="teams-embed-waiting" style="display: none;">
        <div class="teams-embed-waiting-overlay"></div>
        <div class="teams-embed-waiting-indicator x72">
            <div class="teams-embed-waiting-indicator-img x72"></div>
        </div>
    </div>`;

export class Waiting extends HTMLElement {
    constructor()  {
        super();
        this.render();
    }

    show = () => {
        (<HTMLElement>this.querySelector(".teams-embed-waiting")).style.display = "block";
    };

    hide = () => {
        (<HTMLElement>this.querySelector(".teams-embed-waiting")).style.display = "none";
    };

    render = () => {
        const dom = <HTMLElement>template.content.cloneNode(true);
        this.appendChild(dom);
    }
}

customElements.get("waiting-indicator") || customElements.define("waiting-indicator", Waiting);