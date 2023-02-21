import {isVideoTransformDevice} from 'amazon-chime-sdk-js';
import {join} from './chimeFunctions';
import { MeetingUserInterface } from "./MeetingUserInterface";
import { MeetingInfo } from "./MeetingInfo";

/*
    webpack setup from 
        https://dev.to/antonmelnyk/how-to-configure-webpack-from-scratch-for-a-basic-website-46a5
*/
console.log("This is my TypeScript entrypoint, dude!");
console.log("isVideoTransformDevice: ", isVideoTransformDevice(0));



const userInterface:MeetingUserInterface = new MeetingUserInterface();

document.addEventListener("DOMContentLoaded", () => {
    console.log("Hello World!");


    userInterface.attachEventListeners(document);
});