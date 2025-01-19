const $ = (x) => document.querySelector(x);
const $$ = (x) => document.querySelectorAll(x);
const esc = (x) => {
    const txt = document.createTextNode(x);
    const p = document.createElement("p");
    p.appendChild(txt);
    return p.innerHTML;
};

let base = Math.floor(Math.random() * 100 + 200); // Base value for online count
const noise = Math.floor(Math.random() * 10 - 5); // Small random noise
let allTags = [];

// Format numbers larger than 1000 as "1.2K"
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + "K";
    }
    return num.toString();
}

// Update the URL query string with tags
function updateURL(tags) {
    const url = new URL(window.location.href);
    url.searchParams.set("tags", tags.join(","));
    window.history.pushState({}, "", url);
}

// Initialize tags from the URL query string
function initTagsFromURL() {
    const url = new URL(window.location.href);
    const tags = url.searchParams.get("tags");
    const $tags = $("#tag-container");
    if (tags) {
        allTags = tags.split(",");
        allTags.forEach((value) => {
            const tag = createTagElement(value);
            $tags.appendChild(tag);
        });
    }
}

// Create a tag element
function createTagElement(value) {
    const tag = document.createElement("div");
    tag.id = "tag";
    tag.innerHTML = `<p><span>${esc(value)}</span> ×</p>`;
    tag.style = "cursor: pointer";
    tag.onclick = () => {
        tag.remove();
        allTags = allTags.filter((x) => x !== value);
        updateURL(allTags);
    };
    return tag;
}

// Configure the tag input and buttons
function configureTags() {
    const $input = $("#interest-container input");
    const $tags = $("#tag-container");
    const $textBtn = $("#text-btn");
    const $videoBtn = $("#video-btn");

    // Add tags on Enter or comma
    $input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== ",") return;

        const value = $input.value.trim();
        if (!value || allTags.includes(value)) return; // Avoid duplicates or empty values

        const tag = createTagElement(value);
        $tags.appendChild(tag);

        allTags.push(value);
        updateURL(allTags);
        $input.value = "";

        e.preventDefault();
    });

    // Redirect to chat page with tags
    $textBtn.addEventListener("click", () => {
        const interests = Array.from($$("#tag p span")).map((x) => x.innerText);
        window.location.href = "/chat?" + new URLSearchParams({ interests });
    });

    // Redirect to video page with tags
    $videoBtn.addEventListener("click", () => {
        allTags = [];
        const interests = Array.from($$("#tag p span")).map((x) => x.innerText);
        window.location.href = "/video?" + new URLSearchParams({ interests });
    });
}

// Fetch and display the number of people online
async function getPeopleOnline() {
    const $peopleOnline = $("#peopleOnline p span");

    try {
        const res = await fetch("/online");
        if (!res.ok) throw new Error("Failed to fetch online count");

        const { online } = await res.json();
        console.log("Backend response:", online); // Debug backend response

        const totalOnline = base + noise + +online;
        console.log("Calculated total online:", totalOnline); // Debug total calculation

        $peopleOnline.innerHTML = formatNumber(totalOnline);
    } catch (err) {
        console.error(err.message);
        $peopleOnline.innerHTML = formatNumber(base + noise);
    }
}

// Initialize everything on page load
configureTags();
window.addEventListener("load", () => {
    initTagsFromURL();
    getPeopleOnline();
});
