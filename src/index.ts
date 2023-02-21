import { attachEventListeners } from "./MeetingUserInterface";

/*
    webpack setup from 
        https://dev.to/antonmelnyk/how-to-configure-webpack-from-scratch-for-a-basic-website-46a5
*/

console.log("This is my TypeScript entrypoint!");

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded, attaching event listeners");
    attachEventListeners();
});