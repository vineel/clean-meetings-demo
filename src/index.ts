/*
    webpack setup from 
        https://dev.to/antonmelnyk/how-to-configure-webpack-from-scratch-for-a-basic-website-46a5
*/
console.log("This is my TypeScript entrypoint, dude!");

const myFunc = (msg: string) : string => {
    return msg + " .... dude.";
}

console.log("this is my the return from myFunc");