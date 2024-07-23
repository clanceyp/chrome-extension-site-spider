import defaultContent from "../../lib/json/default-settings.js";

let sections = []
const devMode = false;
const storage = chrome.storage.local;
const sectionsDataKey = "settings";
const optionUtils = {
    get: async function(key, callback, options){
        let value;
        const defaultValue = options?.defaultValue;
        const processor = options?.processor;
        await storage.get(key).then(data => {
            value = data[key];
            value = value || defaultValue || null;

            if (typeof processor === "function") {
                value = fn(value);
            } else if (processor === "json") {
                value = JSON.parse(value);
            } else if (processor === "number") {
                value = +value;
            } else if (processor === "boolean") {
                if (typeof value === "string") { // presuming checkbox element
                    let v = value.toLowerCase();
                    value = (v === "true" || v === "on" || v === "1") ? true : false;
                } else if (!isNaN(value)) {
                    value = value > 0;
                } else {
                    value = !!value;
                }
            }
            if (callback) {
                callback(value, key, options);
            }
        });
    },
    set: async function(key,value){
        const data = {}
        data[key] = value;
        await storage.set(data);
    }
};
const setSectionsDataDebounce = debounce(() => setSectionsData());
const draggable = {
    dragRow: null,
    enabled: false,
    children: [],
    enable: (e) => {
        if (e.target.matches("[data-drag-handle]")) {
            e.target.closest("tr").setAttribute("draggable", "true");
            draggable.enabled = true;
        }
    },
    dragend: (e) => {
        draggable.dragRow = null;
        draggable.children = [];
        draggable.enabled = false;
        e.target.closest("tr").removeAttribute("draggable");
    },
    dragstart: (e) => {
        if (!draggable.enabled) {
            return;
        }
        draggable.dragRow = e.target.closest("tr");
        draggable.children = Array.from( draggable.dragRow.closest("tbody").children );
    },
    dragover: (e) => {
        if (!draggable.enabled) {
            return;
        }
        e.preventDefault();
        const tr = e.target.closest("tr");
        const tbody = e.target.closest("tbody");
        if (tr && tbody) { // don't try and drop row into thead or tfoot
            if (draggable.children.indexOf(tr) > draggable.children.indexOf(draggable.dragRow)) {
                tr.after(draggable.dragRow);
            } else {
                tr.before(draggable.dragRow);
            }
        }
    }
}
function debounce(func, timeout = 300){
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
function delay(func, delay = 100){
    setTimeout(func, delay);
}
function empty(element) {
    element.querySelectorAll(":scope > *").forEach(el => el.remove() );
    return element;
}
function isValidJson(str) {
    try {
        let foo = JSON.parse(str);
        return true
    } catch (e) {
        return false;
    }
}
function hasMatchInSection(data, url) {
    const hasMatch = (el) => !!url.match(el.key)
    return data.find(hasMatch);
}
function generateUrlsList(url, data) {
    const list = [];
    const strReExp = hasMatchInSection(data, url)?.key;
    if (!strReExp) {
        return list;
    }
    let re;
    try {
        re = new RegExp(strReExp);
    } catch (e){
        list.push({
            label: "ERROR - ReExp",
            url: "",
            match: false
        });
        return list;
    }

    data.forEach( item => {
        const processedUrl = url.replace(re, item.value);
        if (list.find( existingItem => existingItem.url === processedUrl )) { // add if we don't have it already
            console.log(`Ignoring "${ item.label }". A menu item with the url ${ processedUrl } already exits in the menu.`);
        } else {
            list.push({
                label: item.label || "",
                url: processedUrl,
                match: processedUrl === url,
            });
        }
    });
    return list;
}
function testReg(strRe, strValue) {
    let re;
    try {
        re = new RegExp( strRe );
    } catch(e) {
        console.error(e);
        return null;
    }
    return strValue.match(re);
}
function getSectionsData(callback) {
    if (devMode) {
        console.warn("DEVMODE, using default content");
        callback(defaultContent);
        return;
    }
    optionUtils
        .get(sectionsDataKey, (localStorage => {
            if (localStorage) {
                try {
                    const storageSections = JSON.parse(localStorage);
                    storageSections.forEach( (section, i) => {
                        section.data.forEach((item, ii) => {
                            // todo; add value to static item
                            console.log(item);
                            defaultContent[i].data[ii].value = item.value;
                        })
                    })
                } catch (e) {
                    console.warn(e);
                    sections = defaultContent;
                }
            } else {
                console.warn("cant get data, using fallback content");
                sections = defaultContent;
            }
            callback(defaultContent);
        }));
}
function setSectionsData() {
    optionUtils.set(sectionsDataKey, JSON.stringify(sections))
}
function getSection(sectionId) {
    return sections.find( section => section.id === sectionId );
}
function getSectionIndex(id) {
    return sections.findIndex( section => section.id === id );
}
function validateRegExp(text) {
    try {
        new RegExp(text);
    } catch(e) {
        return false;
    }
    return true;
}
function sortByLabel( a, b ) {
    const a_label = (a.label || "").toLowerCase();
    const b_label = (b.label || "").toLowerCase();
    if ( a_label < b_label ){
        return -1;
    }
    if ( a_label > b_label ){
        return 1;
    }
    return 0;
}
async function getAllMatchingData(callback, url) {
    let sections = [];
    let urlData = []

    optionUtils
        .get(sectionsDataKey, (sectionData => {
            if (sectionData) {
                try {
                    sections = JSON.parse(sectionData);
                } catch (e) {
                    console.warn(e);
                    callback([]);
                }
            }
            sections.forEach( section => {
                const sectionList = generateUrlsList(url, section.data);
                if (sectionList.length) {
                    urlData = urlData.concat(sectionList);
                }
            })
            callback(urlData);
        }));
}

export {
    storage,
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
    getAllMatchingData,
    draggable,
    isValidJson,
    delay
}