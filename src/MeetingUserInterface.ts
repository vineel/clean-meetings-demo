/*
    This file interfaces with the HTML to add event listeners and update the user interface elements on the page.
*/


import { MeetingManager, UIInfo } from './MeetingManager';
export const MeetingInfoEndpoint: string = 'https://i38eaxbmk2.execute-api.us-east-1.amazonaws.com/Prod/meeting';
export const BackgroundReplacementImageUrl: string = 'http://localhost:8080/sunrise.jpg';
const meetingManager:MeetingManager = new MeetingManager(MeetingInfoEndpoint);


/*
    adds event listeners to the UI elements
*/
export const attachEventListeners = async (): Promise<void> => {
    document.getElementById('join-button').addEventListener('click', joinClick);
    document.getElementById('preview-on-button').addEventListener('click', previewStartClick);
    document.getElementById('preview-off-button').addEventListener('click', previewStopClick);
    document.getElementById('blur-on-button').addEventListener('click', blurOnClick);
    document.getElementById('blur-off-button').addEventListener('click', blurOffClick);
    document.getElementById('replace-on-button').addEventListener('click', replaceOnClick);
    document.getElementById('replace-off-button').addEventListener('click', replaceOffClick);
}


/*
    Response handlers for the UI elements
*/

const joinClick = async (e: Event): Promise<void> => {
    console.log("join click!");
    const meetingId: string = "vintest123"; //todo get this from field or querystr
    await meetingManager.initialize(meetingId);
    updateUserInterface();
}

const previewStartClick = async(e:Event): Promise<void> => {
    document.getElementById("preview-video-container").classList.add("localVideoOn");

    const previewVideoElement: HTMLVideoElement = document.getElementById('video-preview') as HTMLVideoElement;
    await meetingManager?.previewStart(previewVideoElement);
    updateUserInterface();
}

const previewStopClick = async(e:Event): Promise<void> => {
    await meetingManager?.previewStop();
    updateUserInterface();
}

const blurOnClick = async(e:Event): Promise<void> => {
    await meetingManager?.blurStart();
}

const blurOffClick = async(e:Event): Promise<void> => {
    await meetingManager?.blurStop();
}

const replaceOnClick = async(e:Event): Promise<void> => {
    await meetingManager?.replaceStart(BackgroundReplacementImageUrl);
}

const replaceOffClick = async(e:Event): Promise<void> => {
    await meetingManager?.replaceStop();
}



/*
    gets state information about the meeting
    updates the user interface to reflect that state
*/
const updateUserInterface = () => {
    const data: UIInfo = meetingManager?.getInfo();
    document.getElementById('meeting-id').innerText = data.meetingId;
    document.getElementById('external-meeting-id').innerText = data.externalMeetingId;
    document.getElementById('attendee-id').innerText = data.attendeeId;
    if (data.previewIsOn) {
        document.getElementById("preview-video-container").classList.add("localVideoPlaying");
    } else {
        document.getElementById("preview-video-container").classList.remove("localVideoPlaying");
    }
}