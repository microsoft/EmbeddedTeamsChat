import { PhotoUtil } from "../Utils/PhotoUtil"
import { PeoplePicker } from "./PeoplePicker";
import { AuthUtil } from "../Utils/AuthUtil";

const template = document.createElement("template");
template.innerHTML = `
    <div class="teams-embed-add-participant-dialog" style="display: none;">
        <div class="teams-embed-add-participant-dialog-form">
            <h3>Add</h3>
            
            <div class="teams-embed-add-participant-dialog-radio">
                <input name="history" value="NoHistory" type="radio"/>
                <label for="NoHistory">Don't include chat history</label>
            </div>
            <div class="teams-embed-add-participant-dialog-radio">
                <input name="history" value="history" type="radio" checked/>
                <label for="history">Include all chat history</label>
            </div>
        </div>
        <div class="teams-embed-add-participant-dialog-buttons">
            <div style="flex-grow: 1"></div>
            <button class="teams-embed-add-participant-dialog-cancel">Cancel</button>
            <button class="teams-embed-add-participant-dialog-add">Add</button>
        </div>
    </div>`;

export class AddParticipantDialog extends HTMLElement {
    private authUtil: AuthUtil;
    private photoUtil: PhotoUtil;
    private graphScopes: string[];
    private onSave?: any;
    private onCancel?: any;
    constructor(authUtil: AuthUtil, photoUtil: PhotoUtil, graphScopes: string[], onSave?: any, onCancel?: any) {
        super();
        this.authUtil = authUtil;
        this.photoUtil = photoUtil;
        this.graphScopes = graphScopes;
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.render();
    }

    show = (meetingExists: boolean) => {
        (<HTMLElement>this.querySelector(".teams-embed-add-participant-dialog")).style.display = "block";
        const radios = <NodeListOf<HTMLElement>>this.querySelectorAll(".teams-embed-add-participant-dialog-radio");
        radios.forEach((element: HTMLElement) => {
            element.style.display = meetingExists ? "block" : "none";
        });
    };

    hide = () => {
        (<HTMLElement>this.querySelector(".teams-embed-add-participant-dialog")).style.display = "none";
    };

    render = async () => {
        const dom = <HTMLElement>template.content.cloneNode(true);

        // initialize and add the people picker
        const authInfo = await this.authUtil.acquireToken(this.graphScopes);
        const peoplePicker: PeoplePicker = new PeoplePicker(authInfo, this.photoUtil);
        (<HTMLElement>dom.querySelector(".teams-embed-add-participant-dialog-form")).children[0].after(peoplePicker);

        (<HTMLElement>dom.querySelector(".teams-embed-add-participant-dialog-add")).addEventListener("click", () => {
            if (this.onSave)
                this.onSave(peoplePicker.getSelections(), true);

            this.hide();
            peoplePicker.clearSelections();
        });

        (<HTMLElement>dom.querySelector(".teams-embed-add-participant-dialog-cancel")).addEventListener("click", () => {
            if (this.onCancel)
                this.onCancel();
            
            this.hide();
            peoplePicker.clearSelections();
        });

        this.appendChild(dom);
    };
}

customElements.get("add-participant-dialog") || customElements.define("add-participant-dialog", AddParticipantDialog);