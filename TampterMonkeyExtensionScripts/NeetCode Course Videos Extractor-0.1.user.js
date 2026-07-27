// ==UserScript==
// @name         NeetCode Course Extractor
// @namespace    https://neetcode.io/
// @version      0.1
// @description  Extract NeetCode course data
// @match        https://neetcode.io/courses/*/0
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    ///////////////////////////////////////////////////////////
    // Entry
    ///////////////////////////////////////////////////////////

    async function main() {

        if (!confirm("Start extracting this course?")) {
            return;
        }

        const course = ExtractCourseData();

        const sections = ExtractSectionsData();

        await ExtractTopicsData(sections);

        await ExtractTopicVideoData(sections);

        console.log({
            course,
            sections
        });

        const export_data = {
            "course": course,
            "sections": sections
        }

        downloadJSON(
            `${course.slug}.json`,
            export_data
        );

    }


    function downloadJSON(filename, data) {
        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        a.remove();
        URL.revokeObjectURL(url);
    }

    ///////////////////////////////////////////////////////////
    // Course
    ///////////////////////////////////////////////////////////

    function ExtractCourseData() {

        const title = document.querySelector("h2.course-title");

        return {
            name: title?.textContent.trim() || "",
            slug: location.pathname.split("/")[2]
        };
    }

    ///////////////////////////////////////////////////////////
    // Sections & Topics
    ///////////////////////////////////////////////////////////


function ExtractSectionsData() {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) {
        throw new Error("Sidebar not found.");
    }

    const sections = [];
    let currentSection = null;

    let sectionOrder = 1;
    let topicOrder = 1; // Reset for each section

    for (const node of sidebar.children) {

        // New Section
        if (node.matches("button.section-header")) {

            currentSection = {
                order: sectionOrder++,
                name: node.querySelector(".section-name")?.textContent.trim() ?? "",
                topics: []
            };

            sections.push(currentSection);
            topicOrder = 1;
            continue;
        }

        // Topic
        if (node.matches("a.sidebar-item") && currentSection) {

            const topicName =
                node.querySelector("#sidebar-item-name")?.textContent.trim() ?? "";

            const href = node.getAttribute("href");

            currentSection.topics.push({
                order: topicOrder++,
                name: topicName,
                href: href        // Useful later when opening the topic
            });
        }
    }

    return sections;
}


    ///////////////////////////////////////////////////////////
    // Topic HTML/CSS
    ///////////////////////////////////////////////////////////

    async function ExtractTopicsData(sections) {

        // TODO:
        // Click each topic
        // Wait for page load
        // Extract:
        //   html
        //   css
    }

    ///////////////////////////////////////////////////////////
    // Vimeo Data
    ///////////////////////////////////////////////////////////



async function ExtractTopicVideoData(sections) {

    const getVideoInfo = () => {

        // Vimeo
        const vimeo = document.querySelector('iframe[src*="player.vimeo.com/video"]');

        if (vimeo) {

            const url = new URL(vimeo.src);

            return {
                type: "vimeo",
                url: vimeo.src,
                videoId: url.pathname.split("/").pop(),
                hash: url.searchParams.get("h")
            };
        }

        // YouTube
        const youtube = document.querySelector('iframe[src*="youtube.com/embed"]');

        if (youtube) {

            const url = new URL(youtube.src);

            return {
                type: "youtube",
                url: youtube.src,
                videoId: url.pathname.split("/").pop()
            };
        }

        return null;
    };

    let previousUrl = getVideoInfo()?.url ?? "";

    for (const section of sections) {

        for (const topic of section.topics) {

            const link = document.querySelector(
                `.sidebar a[href="${topic.href}"]`
            );

            if (!link) continue;

            link.click();

            const video = await new Promise(resolve => {

                const start = Date.now();

                const timer = setInterval(() => {

                    const info = getVideoInfo();

                    if (info && info.url !== previousUrl) {
                        clearInterval(timer);
                        resolve(info);
                        return;
                    }

                    if (Date.now() - start > 10000) {
                        clearInterval(timer);
                        resolve(info);
                    }

                }, 100);

            });

            if (video) {
                previousUrl = video.url;
                topic.video = video;
                console.log("✓", topic.name, video);
            } else {
                console.warn("No video found:", topic.name);
                topic.video = null;
            }
        }
    }

    return sections;
}



    ///////////////////////////////////////////////////////////

    window.addEventListener("load", () => {
        setTimeout(main, 1000);
    });

})();