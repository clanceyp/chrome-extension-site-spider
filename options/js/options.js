/**
 * @author patcla
 */

import {
    sectionsDataKey,
    optionUtils,
    setSectionsDataDebounce,
    debounce,
    empty,
    generateUrlsList,
    testReg,
    getSectionsData,
    getSection,
    getSectionIndex,
    validateRegExp,
    sortByLabel,
    draggable,
    isValidJson,
    delay
} from "./option-utils.js"

let sections = []
const menu = document.querySelector('[id="section-menu"]');
const addSectionButton = document.querySelectorAll('[data-add-section]');
const settingsForm = document.querySelector('[id="settings-form"]');
const settingsFormDynamicSection = settingsForm.querySelector(".dynamic-section");
const settingsEditArea = document.querySelector('[id="settings-as-string-input"]');
const saveRawInputButton = document.querySelector('[data-save-sections-storage]');
const eventUtils = {
    loadAndViewSectionStorage: (e) => {
        e.preventDefault();
        settingsEditArea.value = JSON.stringify(sections,undefined, 4);
        document.querySelectorAll('[data-save-sections-storage]')
            .forEach(el => el.removeAttribute("disabled"))
        settingsEditArea.dispatchEvent(new Event("input", {bubbles: true}))
    },
    validateSettingsFromTextInput: ( { target } ) => {
        if (isValidJson(settingsEditArea.value)) {
            target.setAttribute("aria-invalid", "false");
            saveRawInputButton.removeAttribute("disabled");
        } else {
            target.setAttribute("aria-invalid", "true");
            saveRawInputButton.setAttribute("disabled","true");
        }
    },
    saveSettingsFromTextInput: (e) => {
        e.preventDefault();
        try {
            sections = JSON.parse(settingsEditArea.value);
        } catch (e) {
            console.error(e);
            alert("Couldn't parse the section string, please see error in the browser console");
            return;
        }
        alert("Thank you. Your settings have been updated.");
        reset();
        delay(() => {
            // click on the menu
            document.querySelector('[href="#sectionAbout"]').click();
        });

    },
    updateOnInput: (e) => {
        e.preventDefault();
        updateSectionData(e);
    },
    testUrl: (e) => {
        e.preventDefault();
        getSection(e.target.closest("[data-section-id]").dataset.sectionId)
            .testUrl = e.target.value;
        updateSectionData(e);
    },
    runRegEx: (e) => {
        e.preventDefault();
        const target = e.target;
        const section = getSection(e.target.closest("[data-section-id]").dataset.sectionId);
        const fieldset = target.closest("[data-section-id]");
        const testUrl = fieldset.querySelector("[data-test-url]").value;
        const hasMatch = section.data.find( item => {
            if (item.key) {
                item.reResult = testReg(item.key, testUrl)
                return !!item.reResult;
            }
            return false;
        })
        if (hasMatch) {
            listRegAdmin(testUrl, section.data, fieldset);
        } else {
            noAdminMatch(fieldset);
        }
    },
    removeRow: (e) => {
        e.preventDefault();
        const target = e.target;
        const currentRow = target.closest("tr");
        const label = currentRow.querySelector("[data-label]").value;
        const table = target.closest("[data-section-id]");
        if (confirm(`You are about to remove ${ label || "this row" } are you sure?`)) {
            currentRow.remove();
            updateSectionDataByTable( table);
        }
    },
    addRow: (e) => {
        e.preventDefault();
        const target = e.target;
        const table = target.closest("[data-section-id]");
        const tbody = table.querySelector("[data-rows]");
        tbody.insertAdjacentHTML(`beforeend`, generateTableRow( "", "", ""));
    },
    removeSection: (e) => {
        e.preventDefault();
        const target = e.target;
        const fieldset = target.closest("[data-section-id]");
        const sectionId = fieldset.dataset.sectionId;
        const title = fieldset.querySelector("[data-title]").value;
        if (confirm(`You are about to remove "${ title }" section, are you sure?`)) {
            removeSection( sectionId );
        }
    }
}
function noAdminMatch(fieldset) {
    const results = fieldset.querySelector("[data-results]");
    empty(results).insertAdjacentHTML("beforeend", "<li>Sorry no matches found. Please check your regex.</li>");
}
function listRegAdmin(testUrl, data, fieldset) {
    const listData = generateUrlsList(testUrl, data);
    const results = fieldset.querySelector("[data-results]");
    let listHTML = "";
    listData.sort(sortByLabel).forEach( item => {
        listHTML += `<li class="test-url ${ ( item.match ) ? "test-url--matches-true" : "test-url--matches-false" }">
            ${ item.label } <span>(${ item.url })</span>
        </li>`;
    })
    empty(results).insertAdjacentHTML("beforeend", listHTML);
}
function setSectionsData() {
    optionUtils.set(sectionsDataKey, JSON.stringify(sections))
}
function populateManifestData() {
    const manifest = chrome.runtime.getManifest();
    const items = document.querySelectorAll("[data-manifest]")
    items.forEach(element => {
        if (element.dataset.manifest.startsWith("icon")) {
            const imgSrc = chrome.runtime.getURL(manifest.icons[element.dataset.manifest.split("-").pop()]);
            if (element.tagName === "IMG") {
                element.src = imgSrc;
            } else {
                element.style.backgroundImage = `url(${ imgSrc })`
            }
        } else if (element.dataset.manifest === "homepage_url") {
            element.setAttribute("href", manifest[element.dataset.manifest] );
        } else {
            element.textContent = manifest[element.dataset.manifest] || "";
        }
    })
}
function generateTable(section) {
    return `<table data-section-id="${ section.id }" class="data uk-table uk-table-small">
    <colgroup>
       <col span="1" style="width: 33%;">
       <col span="1" style="width: 33%;">
       <col span="1" style="width: 33%;">
       <col span="1" style="width: 30px;">
    </colgroup>
    <thead>
        <tr>
            <th>URL matche(s)</th>
            <th>URLs to generate</th>
            <th>Menu label</th>
            <th aria-label="Delete"></th>
        </tr>
    </thead>
    <tbody data-rows></tbody>
    <tfoot>
        <tr>
            <td colspan="3" class="uk-text-right"><button data-add-row class="uk-button uk-button-secondary uk-button-small">Add row</button></td>
            <td></td>
        </tr>
    </tfoot>
</table>`;
}
function generateTableRow(key, value = "", label = "") {
    return `<tr>
            <td><input class="uk-input" data-update-on-input value="${ key }" data-key type="text" aria-invalid="${ (!validateRegExp( key )).toString() }"></td>
            <td><input class="uk-input" data-update-on-input value="${ value }" data-value type="text"></td>
            <td><input class="uk-input" data-update-on-input value="${ label }" data-label type="text"></td>
            <td><button class="uk-icon-button uk-icon-button--delete" title="Delete this row" data-remove-row data-drag-handle aria-label="Remove row"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 24 24" role="presentation"><use href="#TrashCan" /></svg></button></td>
        </tr>`;
}
function addMenuHMTL(html) {
    menu.insertAdjacentHTML('beforeend', html);
}
function isEnabled(targetValue, dependsValue) {
    return !!(targetValue && (targetValue === dependsValue || dependsValue === "not-empty"));
}
function isItemDisabled(depends, section) {
    const targetValue = section.data.find( el => el.id = depends.id )?.value;
    return !isEnabled(targetValue, depends.value);
};
function dependsAttributes(depends, section) {
    if (!depends) {
        return "";
    }
    return  `data-depends-el="${ depends.id }" data-depends-value="${ depends.value || 'not-empty' }" data-disabled="${ isItemDisabled(depends, section) }"`;
}
function makeInput(item, type, section){
    let rowHTML = "";
    if (type === "text") {
        rowHTML = `<label for="${ item.id }">${item.label}</label><input ${ dependsAttributes(item.depends, section) } class="uk-input" aria-describedby="help-${ item.id }" id="${ item.id }" value="${ item.value }" name="${ item.name }" />`;
    }
    if (type === "textarea") {
        rowHTML = `<label for="${ item.id }">${ item.label}</label><textarea ${ dependsAttributes(item.depends, section) } class="uk-textarea" aria-describedby="help-${ item.id }" id="${ item.id }" name="${ item.name }">${ item.value }</textarea>`;
    }
    if (type === "range") {
        rowHTML = `<label for="${ item.id }">${ item.label } (<span data-value>${ item.value }</span>)</label><input class="" aria-describedby="help-${ item.id }" id="${ item.id }" type="range" name="${ item.name }" max="${ item.max }" min="${ item.min}" value="${ item.value }" />`;
    }
    if (type === "checkbox") {
        rowHTML = `<label for="${ item.id }">
                <input type="hidden" name="${ item.name }" value="${ item.value }" id="hidden-${ item.id }">
                <input class="uk-checkbox" aria-describedby="help-${ item.id }" id="${ item.id }" type="checkbox" ${ item.value.includes("true") ? 'checked' : '' }  /> ${ item.label}</label>`;
    }
    if (type === "select") {
        const getOptions = () => {
            let options = "";
            item.options.forEach( option => {
                options += `<option value="${ option.value }" ${ item.value === option.value ? 'selected' : ''}>${ option.label || option.value }</option>`
            })
            return options;
        }
        rowHTML = `<label for="${ item.id }">${ item.label}</label><select class="uk-select" aria-describedby="help-${ item.id }" name="${ item.name }" id="${ item.id }">${ getOptions() }</select>`;
    }
    if (type === "radio") {
        const getOptions = () => {
            let options = "";
            item.options.forEach( (option, i) => {
                const optionId =  `${ option.value.toLowerCase().replace(/\W/g,"-") }-${ i }`;
                options += `<div><input id="${optionId}" ${ item.value === option.value ? 'checked' : ''} type="radio" name="${ item.name }" value="${ option.value }" /><label for="${ optionId }">${ option.label || option.value }</label></div>`
            })
            return options;
        }
        rowHTML = `<fieldset class="uk-fieldset"><legend class="uk-legend">${ item.label}</legend><div>${ getOptions() }</div></fieldset>`;
    }
    return `<div>
    <style>
        [id="help-button-${ item.id }"] {anchor-name: --help-${ item.id }}
        [id="help-${ item.id }"] {position-anchor: --help-${ item.id }}
    </style>
    <button class="help-button" id="help-button-${ item.id }" aria-label="Show help"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 30 30" role="presentation"><use href="#Help" /></svg></button>
    <div id="help-${ item.id }" class="help">${ item.help }</div>
    ${ rowHTML }
</div>`;
}
function generateFormContent(section) {
    let HTML = "";
    section.data.forEach( element => {
        HTML += `<div class="uk-margin --margin-${element.type}">
    ${ makeInput(element, element.type, section) }
</div>`
    })
    return HTML;
}
function populateSectionData(s) {
    sections = s;
    const addId = (section, i) => {
        if (!section.title) { // no title, remove the
            // sections.splice(i, 1);
            section.title = "invalid"
        }
        section.id = `section-${i}-${section.title.toLowerCase().replaceAll(/[^\w]/g, "-")}`;
    }
    const addMenuItem = section => {
        addMenuHMTL(`
            <li class="settings__navigation-item">
                <a class="settings__navigation-link" href="#${ section.id }" data-section-title="${ section.id }" aria-current="false">${ section.title }</a>
            </li>
        `)
    }
    const addMainFormSection = section => {
        settingsFormDynamicSection.insertAdjacentHTML("beforeend", `
        <fieldset id="${ section.id }" class="settings__section uk-fieldset" aria-hidden="true" data-section-id="${ section.id }">
            <legend class="uk-legend">
                <input type="text" data-title value="${ section.title }" name="${ section.id }" class="as-legend" />
            </legend>
            ${ generateFormContent(section) }
        </fieldset>`)
    }
    sections.forEach(addId);
    sections.forEach(addMenuItem);
    sections.forEach(addMainFormSection);
    addMenuHMTL(`<li class="settings__navigation-item" id="sectionAboutNavItem">
        <a class="settings__navigation-link" aria-current="false" href="#sectionAbout">About</a>
    </li>`);
    // show default form fieldset
    document.querySelector(".settings__section")
        .setAttribute("aria-hidden", "false");
    document.querySelector(".settings__navigation-link")
        .setAttribute("aria-current", "true");
}
function navigationAction(e) {
    const sectionSelector = e.target.getAttribute("href");
    if (document.querySelector(sectionSelector)) {
        e.preventDefault();
        // set menu
        document.querySelectorAll('.settings__navigation-link[aria-current="true"]')
            .forEach(a => a.setAttribute("aria-current", "false"))
        // set content
        document.querySelectorAll('.settings__section[aria-hidden="false"]')
            .forEach(a => a.setAttribute("aria-hidden", "true"))

        document.querySelector(sectionSelector)
            .setAttribute("aria-hidden", "false");
        e.target.setAttribute("aria-current", "true");
        settingsEditArea.value = "";
        settingsEditArea.setAttribute("aria-invalid","false");
    }
}
function titleUpdate(e) {
    if (e.target.matches("input[data-title]")) {
        const title = e.target.value;
        const id = e.target.name;
        const section = getSection(id);
        section.title = title;

        document
            .querySelectorAll(`[data-section-title="${id}"]`)
            .forEach( el => el.innerText = title);
        setSectionsDataDebounce();
    }
}
function updateSectionData(e) {
    // updateSectionDataByTable( e.target.closest("[data-section-id]") );
    const sectionData = {
        "title": "Extension Settings",
        "data": [],
        "id": "section-0"
    }
    const formData = new FormData(settingsForm);

    for (const [key, value] of formData) {
        if ( key && !key.startsWith("section") ) {
            sectionData.data.push({
                key,
                value
            })
        }
    }

    optionUtils.set(sectionsDataKey, JSON.stringify([sectionData]));
}
function updateSectionDataByTable(table) {
    if (!table) {
        return;
    }
    const sectionId = table.dataset.sectionId;
    const rows = table.querySelectorAll("[data-rows] tr");
    const section = getSection(sectionId);
    let newData = [];
    rows.forEach( row => {
        newData.push({
            "key": row.querySelector("[data-key]").value,
            "value": row.querySelector("[data-value]").value,
            "label": row.querySelector("[data-label]").value
        })
    })
    section.data = newData;

    setSectionsDataDebounce();
}
function checkDependentElements(e) {
    const id = e.target.id;
    const value = e.target.value;
    const dependents = settingsFormDynamicSection.querySelectorAll(`[data-depends-el="${ id }"]`);

    dependents.forEach( el => {
        el.setAttribute("data-disabled", !isEnabled(value, el.dataset.dependsValue));
    });
}
function formOnAction(e) {
    // delegate events
    const target = e.target;

    if (target.type === "range") {
        const displayValue = target.parentNode.querySelector("[data-value]");
        if (displayValue) {
            displayValue.textContent = target.value;
        }
    }

}
function formUpdate(e) {
    // delegate events
    const target = e.target;

    if (target === saveRawInputButton) {
        eventUtils.saveSettingsFromTextInput(e);
    }
    if (target.matches('[type="checkbox"]') && e.type === "click") {
        target.parentNode.querySelector('[type="hidden"]').value = target.checked;
    }
    if (target === settingsEditArea && e.type === "input") {
        eventUtils.validateSettingsFromTextInput(e);
    }
    if (target.matches("[data-view-sections-storage]")) {
        eventUtils.loadAndViewSectionStorage(e);
    }
    if (e.type === "input") {
        eventUtils.updateOnInput(e);
    }
}
function addSection() {
    const title = prompt("Please add a title", "");
    if (!title) {
        return;
    }
    const newSection = {
        title,
        data: [{key:"", value: "", label: ""}]
    }
    const insertAt = parseInt(prompt("Please add list position (First place = 0. Leave blank to add at the end)") || sections.length );
    sections.splice( insertAt, 0, newSection );
    reset();

    const openNewSection = (mutationList, observer) => {
        observer.disconnect();
        if (document.querySelectorAll(".settings__navigation-link")[ insertAt ]) {
            document.querySelectorAll(".settings__navigation-link")[ insertAt ].click()
        }
    };
    const observer = new MutationObserver(openNewSection);
    observer.observe(menu, { attributes: false, childList: true, subtree: true });
}
function removeSection(sectionId) {
    const index = getSectionIndex(sectionId);
    if (index > -1) {
        sections.splice(index, 1);
    }
    reset();
}
function addEventListeners() {
    menu.addEventListener("click", navigationAction);
    addSectionButton.forEach( button => {
        button.addEventListener("click", addSection);
    })
    settingsForm.addEventListener("input", debounce((e) => titleUpdate(e)));
    settingsForm.addEventListener("input", debounce((e) => formUpdate(e)));
    settingsForm.addEventListener("input", formOnAction);
    settingsForm.addEventListener("input", checkDependentElements);
    settingsForm.addEventListener("click", formUpdate);
    settingsForm.addEventListener("submit", e => e.preventDefault());

    document.documentElement.addEventListener("mousedown", draggable.enable)
    document.documentElement.addEventListener("dragstart", draggable.dragstart);
    document.documentElement.addEventListener("dragend", draggable.dragend);
    document.documentElement.addEventListener("dragend", debounce((e) => updateSectionData(e)));
    document.documentElement.addEventListener("dragover", draggable.dragover);
}
function reset() {
    setSectionsData();
    empty(menu);
    empty(settingsFormDynamicSection);
    getSectionsData(populateSectionData);

}
async function init() {
    populateManifestData();
    await getSectionsData(populateSectionData);
    addEventListeners();
}

await init();


