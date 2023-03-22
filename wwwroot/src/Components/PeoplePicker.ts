import { GraphUtil } from "../Utils/GraphUtil";
import { AuthInfo } from "../Models/AuthInfo";
import { Person } from "../Models/Person"
import { PeopleItem } from "./PeopleItem";
import { PeoplePickerSelection } from "./PeoplePickerSelection";
import { PhotoUtil } from "../Utils/PhotoUtil"

const template = document.createElement("template");
template.innerHTML = `
    <div class="teams-embed-peoplepicker">
        <div class="teams-embed-peoplepicker-input-wrapper">
            <div class="teams-embed-peoplepicker-input">
                <div class="teams-embed-peoplepicker-input-ctrl" contenteditable="true"></div>
            </div>
        </div>
        <div class="teams-embed-peoplepicker-suggestions" style="display: none">

            <div class="teams-embed-peoplepicker-waiting">
                <div class="teams-embed-waiting-indicator x24">
                    <div class="teams-embed-waiting-indicator-img x24"></div>
                </div>
            </div>
            <div class="teams-embed-peoplepicker-noresults" style="display: none;">
                We didn't find any matches
            </div>
        </div>
    </div>`;

//TODO: needs exclude list for existing members
export class PeoplePicker extends HTMLElement {
    private authInfo: AuthInfo;
    private searchResults: Person[];
    private selections: Person[];
    private photoUtil: PhotoUtil;
    private searchInputText: string;
    constructor(authInfo: AuthInfo, photoUtil: PhotoUtil) {
        super();
        this.authInfo = authInfo;
        this.photoUtil = photoUtil;
        this.searchResults = [];
        this.selections = [];
        this.searchInputText = "";
        this.render();
    }

    clearSelections = () => {
        this.selections = [];
        const picker = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-input-wrapper");
        const selectedUsers = picker.getElementsByTagName('people-picker-selection')
        for (let i = 0; i < selectedUsers.length; i++) {
            picker.removeChild(selectedUsers[i]);
        }
    }

    getSelections = () => {
        return this.selections;
    };

    personSelected = (selectedIndex: number) => {
        const input = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-input-ctrl");
        const suggestionContainer = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-suggestions");
        const picker = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-input-wrapper");
        const inputOuter = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-input");

        input.innerText = "";
        suggestionContainer.style.display = "none";
        const selection: Person = this.searchResults[selectedIndex];
        this.selections.push(selection);
        this.searchResults = [];
        this.searchInputText = "";

        const insertIndex = this.selections.length - 1;
        picker.insertBefore(
            new PeoplePickerSelection(selection, insertIndex, this.personRemoved.bind(this, selection)),
            inputOuter,
        );
    };

    personRemoved = (selection: Person) => {
        const picker = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-input-wrapper");
        const index = this.selections.indexOf(selection);
        this.selections.splice(index, 1);
        picker.removeChild(picker.children[index]);
    };

    render = () => {
        const dom = <HTMLElement>template.content.cloneNode(true);
        //TODO: keydown for ENTER and TAB
        (<HTMLElement>dom.querySelector(".teams-embed-peoplepicker-input-ctrl")).addEventListener(
            "keyup",
            async (evt: any) => {
                // get the suggestions pane DOM elements
                const suggestionContainer = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-suggestions");
                const waiting = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-waiting");
                const noresults = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-noresults");
                // TODO if there is another people picker element this may not get the right picker
                const input = <HTMLElement>document.querySelector(".teams-embed-peoplepicker-input-ctrl");

                // check what to do
                if (evt.key == "Escape") {
                    // close the suggestions
                    this.searchResults = [];
                    suggestionContainer.style.display = "none";
                    waiting.style.display = "none";
                    noresults.style.display = "none";
                    input.innerText = "";
                    this.searchInputText = "";
                }

                if (evt.key == "Backspace" && this.searchInputText == "") {
                    // if there are no results and the user presses the backspace
                    // remove the last selected item
                    if (this.selections.length > 0) {
                        this.personRemoved(this.selections[this.selections.length - 1]);
                    }
                }

                if (this.searchInputText == input.innerText || evt.key == " ") {
                    // if the users presses a non-alphanumeric key
                    // we do not want to fetch new results
                    return;
                }

                this.searchInputText = input.innerText;
                
                if (input.innerText.length <= 1) {
                    this.searchResults = [];
                    
                    // clear any old suggestions
                    // but leave the waiting and no results div (last 2 items in div)
                    while (suggestionContainer.children.length > 2) {
                        suggestionContainer.removeChild(suggestionContainer.children[0]);
                    }
                }
                else {
                    // display suggestions container and waiting indicator
                    suggestionContainer.style.display = "block";
                    waiting.style.display = "block";
                    noresults.style.display = "none";

                    // call graph to get matches
                    const results = await GraphUtil.searchUsers(this.authInfo.accessToken, input.innerText);

                    // clear any old suggestions
                    while (suggestionContainer.children.length > 2) {
                        suggestionContainer.removeChild(suggestionContainer.children[0]);
                    }

                    // parse the results
                    this.searchResults = [];
                    const selectedIds = this.selections.map((p: Person) => {
                        return p.id;
                    });
                    results.forEach((obj: any, i: number) => {
                        if (selectedIds.indexOf(obj.id) === -1) {
                            const person: Person = {
                                id: obj.id,
                                displayName: obj.displayName,
                                userPrincipalName: obj.userPrincipalName,
                                photo: this.photoUtil.emptyPic,
                            };
                            this.searchResults.push(person);
                            const index = this.searchResults.length - 1;
                            const peopleItem = new PeopleItem(person, index, this.personSelected.bind(this, index));
                            suggestionContainer.insertBefore(peopleItem, waiting);
                            this.photoUtil.getGraphPhotoAsync(this.authInfo.accessToken, person.id).then((pic: string) => {
                                person.photo = pic;
                                peopleItem.refresh(person);
                            });
                        }
                    });

                    // show no results if empty
                    if (this.searchResults.length === 0) {
                        noresults.style.display = "block";
                    }

                    // update the UI
                    waiting.style.display = "none";
                }
            },
        );

        this.appendChild(dom);
    };
}

customElements.get("people-picker") || customElements.define("people-picker", PeoplePicker);