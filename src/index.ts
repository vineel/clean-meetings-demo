import {isVideoTransformDevice} from 'amazon-chime-sdk-js';
import {join} from './chimeFunctions';

/*
    webpack setup from 
        https://dev.to/antonmelnyk/how-to-configure-webpack-from-scratch-for-a-basic-website-46a5
*/
console.log("This is my TypeScript entrypoint, dude!");
console.log("isVideoTransformDevice: ", isVideoTransformDevice(0));

const myFunc = (msg: string) : string => {
    return msg + " .... dude.";
}

console.log("this is my the return from myFunc");

function joinMeeting(): string {
    join();

    console.log("Done done done done!");
    return "Done done done done!";
}


document.addEventListener("DOMContentLoaded", () => {
    console.log("Hello World!");

    let btn = document.getElementById('join-button');
    console.log("button: ", btn);
    btn.onclick = function(){ joinMeeting() }; 
});